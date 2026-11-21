import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { hasDatabase, sql } from "./client";

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
    await sql.unsafe(`
      create table if not exists schema_migrations (
        name text primary key,
        applied_at timestamptz not null default now()
      )
    `);
    const doneRows = await sql<{ name: string }[]>`select name from schema_migrations`;
    const done = new Set(doneRows.map((row) => row.name));
    const existing =
      await sql<{ users: string | null }[]>`select to_regclass('public.users') as users`;
    const schemaPresent = Boolean(existing[0]?.users);

    for (const file of files) {
      if (done.has(file)) continue;
      if (schemaPresent && file.startsWith("001_")) {
        await sql`insert into schema_migrations (name) values (${file})`;
        continue;
      }
      const body = await readFile(path.join(dir, file), "utf8");
      await sql.begin(async (tx) => {
        await tx.unsafe(body);
        await tx`insert into schema_migrations (name) values (${file})`;
      });
    }
  } finally {
    await sql`select pg_advisory_unlock(7272741)`;
  }
}
