import { readdir, readFile } from "node:fs/promises";
import pg from "pg";

const url = process.env.DATABASE_URL?.trim() ?? "";
const files = (await readdir("migrations").catch(() => []))
  .filter((f) => f.endsWith(".sql"))
  .sort();
if (url === "" || files.length === 0) {
  console.log("migrate: nothing to do");
  process.exit(0);
}
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL_UNPOOLED?.trim() || url,
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
