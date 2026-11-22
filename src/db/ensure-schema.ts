import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { hasDatabase, sql } from "./client";
import {
  isDuplicateSchemaError,
  splitSqlStatements,
  TABLE_SENTINELS,
} from "./sql-statements";

let pending: Promise<void> | null = null;

export function ensureSchema() {
  if (!hasDatabase() || !sql) return Promise.resolve();
  pending ??= applyMigrations().catch((error) => {
    pending = null;
    throw error;
  });
  return pending;
}

async function applyMigrations() {
  const dir = path.join(process.cwd(), "migrations");
  const files = (await readdir(dir).catch(() => []))
    .filter((file) => file.endsWith(".sql"))
    .sort();
  if (files.length === 0) return;

  await sql`select pg_advisory_lock(7272741)`;
  try {
    const migrationsTable =
      await sql<{ rel: string | null }[]>`select to_regclass('public.schema_migrations') as rel`;
    if (migrationsTable[0]?.rel) {
      const cols = await sql<{ column_name: string }[]>`
        select column_name from information_schema.columns
        where table_schema = 'public' and table_name = 'schema_migrations'
      `;
      if (!cols.some((row) => row.column_name === "name")) {
        await sql.unsafe(
          "alter table public.schema_migrations rename to schema_migrations_legacy",
        );
      }
    }

    await sql.unsafe(`
      create table if not exists schema_migrations (
        name text primary key,
        applied_at timestamptz not null default now()
      )
    `);

    for (const [table, sentinel] of TABLE_SENTINELS) {
      const rel =
        await sql.unsafe(`select to_regclass('public.${table}') as rel`) as {
          rel: string | null;
        }[];
      if (!rel[0]?.rel) continue;
      const col = await sql.unsafe(
        `select 1 as ok from information_schema.columns
         where table_schema = 'public' and table_name = '${table}' and column_name = '${sentinel}'`,
      ) as { ok: number }[];
      if (col.length > 0) continue;
      const taken =
        await sql.unsafe(
          `select to_regclass('public.${table}_legacy_unused') as rel`,
        ) as { rel: string | null }[];
      const dest = taken[0]?.rel
        ? `${table}_legacy_${Date.now()}`
        : `${table}_legacy_unused`;
      await sql.unsafe(`alter table public.${table} rename to ${dest}`);
    }

    const passwordHash = await sql<{ ok: number }[]>`
      select 1 as ok from information_schema.columns
      where table_schema = 'public' and table_name = 'users' and column_name = 'password_hash'
    `;
    const mediaAssets =
      await sql<{ rel: string | null }[]>`select to_regclass('public.media_assets') as rel`;
    if (passwordHash.length === 0 || !mediaAssets[0]?.rel) {
      await sql.unsafe(
        "delete from schema_migrations where name ~ '^[0-9]{3}_'",
      );
    }

    const repair = files.find((file) => file.startsWith("007_"));
    if (repair) {
      const statements = splitSqlStatements(
        await readFile(path.join(dir, repair), "utf8"),
      );
      for (const statement of statements) {
        try {
          await sql.unsafe(statement);
        } catch (error) {
          if (!isDuplicateSchemaError(error)) throw error;
        }
      }
    }

    const doneRows =
      await sql<{ name: string }[]>`select name from schema_migrations`;
    const done = new Set(doneRows.map((row) => row.name));

    for (const file of files) {
      if (done.has(file)) continue;
      const body = await readFile(path.join(dir, file), "utf8");
      const statements = splitSqlStatements(body);
      await sql.begin(async (tx) => {
        for (const statement of statements) {
          await tx.unsafe("savepoint askinvest_mig");
          try {
            await tx.unsafe(statement);
            await tx.unsafe("release savepoint askinvest_mig");
          } catch (error) {
            await tx.unsafe("rollback to savepoint askinvest_mig");
            if (!isDuplicateSchemaError(error)) throw error;
          }
        }
        await tx`insert into schema_migrations (name) values (${file})`;
      });
    }
  } finally {
    await sql`select pg_advisory_unlock(7272741)`;
  }
}
