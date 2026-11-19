import { readdir, readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import pg from "pg";

try {
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const eq = trimmed.indexOf("=");
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key && process.env[key] == null) process.env[key] = value;
  }
} catch {
  // Hosts such as Vercel inject DATABASE_URL without a local .env file.
}

const url =
  process.env.DATABASE_URL?.trim() ||
  process.env.POSTGRES_URL?.trim() ||
  process.env.POSTGRES_PRISMA_URL?.trim() ||
  "";
const files = (await readdir("migrations").catch(() => []))
  .filter((f) => f.endsWith(".sql"))
  .sort();
if (url === "" || files.length === 0) {
  console.log("migrate: nothing to do");
  process.exit(0);
}
const client = new pg.Client({
  connectionString:
    process.env.DATABASE_URL_UNPOOLED?.trim() ||
    process.env.POSTGRES_URL_NON_POOLING?.trim() ||
    url,
});
await client.connect();
try {
  await client.query("set lock_timeout = '60s'");
  await client.query("select pg_advisory_lock(7272741)");
  await client.query(
    "create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())",
  );
  const done = new Set(
    (await client.query("select name from schema_migrations")).rows.map(
      (r) => r.name,
    ),
  );
  const existing = await client.query(
    "select to_regclass('public.users') as users",
  );
  const schemaPresent = Boolean(existing.rows[0]?.users);

  for (const file of files.filter((f) => !done.has(f))) {
    if (schemaPresent && file.startsWith("001_")) {
      await client.query("insert into schema_migrations (name) values ($1)", [
        file,
      ]);
      console.log(`migrate: recorded ${file} (schema already present)`);
      continue;
    }
    await client.query("begin");
    try {
      await client.query(await readFile(`migrations/${file}`, "utf8"));
      await client.query("insert into schema_migrations (name) values ($1)", [
        file,
      ]);
      await client.query("commit");
      console.log(`migrate: applied ${file}`);
    } catch (error) {
      await client.query("rollback");
      throw error;
    }
  }
} finally {
  await client.end();
}
