import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { hasDatabase, sql } from "./client";
import {
  isDuplicateSchemaError,
  splitSqlStatements,
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

    const userCols = await sql<{ column_name: string }[]>`
      select column_name from information_schema.columns
      where table_schema = 'public' and table_name = 'users'
    `;
    if (
      userCols.length > 0 &&
      !userCols.some((row) => row.column_name === "password_hash")
    ) {
      await sql.unsafe(
        "alter table public.users rename to users_legacy_unused",
      );
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
