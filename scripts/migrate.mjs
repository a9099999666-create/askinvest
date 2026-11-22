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

const DUPLICATE = new Set(["42710", "42P07", "42701", "42P16", "42723"]);

const TABLE_SENTINELS = [
  ["users", "password_hash"],
  ["media_assets", "storage_key"],
  ["site_settings", "contacts_html"],
  ["contacts", "notes"],
  ["leads", "public_key"],
  ["properties", "slug"],
  ["services", "slug"],
  ["property_versions", "address"],
  ["service_versions", "short_description"],
  ["sessions", "token_hash"],
  ["messages", "body"],
  ["threads", "unread_count"],
  ["campaigns", "title"],
  ["campaign_recipients", "campaign_id"],
  ["channel_identities", "external_id"],
  ["invitations", "token_hash"],
  ["jobs", "payload"],
  ["lead_markers", "code"],
  ["provider_events", "external_event_id"],
  ["subscription_topics", "consent_text"],
  ["subscriptions", "consent_version"],
];

function splitSqlStatements(sql) {
  const out = [];
  let buf = "";
  let i = 0;
  let inSingle = false;
  let inDouble = false;
  let dollar = null;

  while (i < sql.length) {
    const c = sql[i];
    if (dollar) {
      if (sql.startsWith(dollar, i)) {
        buf += dollar;
        i += dollar.length;
        dollar = null;
        continue;
      }
      buf += c;
      i += 1;
      continue;
    }
    if (inSingle) {
      buf += c;
      if (c === "'" && sql[i + 1] === "'") {
        buf += "'";
        i += 2;
        continue;
      }
      if (c === "'") inSingle = false;
      i += 1;
      continue;
    }
    if (inDouble) {
      buf += c;
      if (c === '"') inDouble = false;
      i += 1;
      continue;
    }
    if (c === "-" && sql[i + 1] === "-") {
      while (i < sql.length && sql[i] !== "\n") {
        buf += sql[i];
        i += 1;
      }
      continue;
    }
    if (c === "'") {
      inSingle = true;
      buf += c;
      i += 1;
      continue;
    }
    if (c === '"') {
      inDouble = true;
      buf += c;
      i += 1;
      continue;
    }
    if (c === "$") {
      const match = sql.slice(i).match(/^\$[A-Za-z0-9_]*\$/);
      if (match) {
        dollar = match[0];
        buf += dollar;
        i += dollar.length;
        continue;
      }
    }
    if (c === ";") {
      const stmt = buf.trim();
      if (stmt) out.push(stmt);
      buf = "";
      i += 1;
      continue;
    }
    buf += c;
    i += 1;
  }
  const tail = buf.trim();
  if (tail) out.push(tail);
  return out;
}

const url =
  process.env.DATABASE_URL_UNPOOLED?.trim() ||
  process.env.POSTGRES_URL_NON_POOLING?.trim() ||
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

const needsSsl = /neon\.tech|supabase\.co|sslmode=require/i.test(url);
const client = new pg.Client({
  connectionString: url,
  ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
});
try {
  await client.connect();
} catch (error) {
  console.error("migrate: could not connect; continuing build:", error?.message);
  process.exit(0);
}
try {
  await client.query("set lock_timeout = '60s'");
  await client.query("select pg_advisory_lock(7272741)");

  const migrationsTable = await client.query(
    "select to_regclass('public.schema_migrations') as rel",
  );
  if (migrationsTable.rows[0]?.rel) {
    const cols = await client.query(`
      select column_name from information_schema.columns
      where table_schema = 'public' and table_name = 'schema_migrations'
    `);
    const names = new Set(cols.rows.map((row) => row.column_name));
    if (!names.has("name")) {
      await client.query(
        "alter table public.schema_migrations rename to schema_migrations_legacy",
      );
      console.log("migrate: renamed leftover schema_migrations");
    }
  }

  await client.query(
    "create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())",
  );

  for (const [table, sentinel] of TABLE_SENTINELS) {
    const rel = await client.query("select to_regclass($1) as rel", [
      `public.${table}`,
    ]);
    if (!rel.rows[0]?.rel) continue;
    const col = await client.query(
      `select 1 from information_schema.columns
       where table_schema = 'public' and table_name = $1 and column_name = $2`,
      [table, sentinel],
    );
    if (col.rowCount > 0) continue;
    const destBase = `${table}_legacy_unused`;
    const taken = await client.query("select to_regclass($1) as rel", [
      `public.${destBase}`,
    ]);
    const dest = taken.rows[0]?.rel ? `${table}_legacy_${Date.now()}` : destBase;
    await client.query(`alter table public.${table} rename to ${dest}`);
    console.log(`migrate: renamed leftover public.${table}`);
  }

  const passwordHash = await client.query(`
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'users' and column_name = 'password_hash'
  `);
  const mediaAssets = await client.query(
    "select to_regclass('public.media_assets') as rel",
  );
  if (passwordHash.rowCount === 0 || !mediaAssets.rows[0]?.rel) {
    await client.query(
      "delete from schema_migrations where name ~ '^[0-9]{3}_'",
    );
    console.log("migrate: reset incomplete migration history");
  }

  const repair = files.find((file) => file.startsWith("007_"));
  if (repair) {
    const statements = splitSqlStatements(
      await readFile(`migrations/${repair}`, "utf8"),
    );
    for (const statement of statements) {
      try {
        await client.query(statement);
      } catch (error) {
        if (!DUPLICATE.has(error?.code)) {
          console.error(`migrate: failed ${repair} prelude: ${error?.message}`);
          throw error;
        }
      }
    }
    console.log("migrate: repaired missing columns");
  }

  const done = new Set(
    (await client.query("select name from schema_migrations")).rows.map(
      (r) => r.name,
    ),
  );

  for (const file of files.filter((f) => !done.has(f))) {
    const body = await readFile(`migrations/${file}`, "utf8");
    const statements = splitSqlStatements(body);
    await client.query("begin");
    try {
      for (const statement of statements) {
        await client.query("savepoint askinvest_mig");
        try {
          await client.query(statement);
          await client.query("release savepoint askinvest_mig");
        } catch (error) {
          await client.query("rollback to savepoint askinvest_mig");
          if (!DUPLICATE.has(error?.code)) {
            const pos = error?.position ? Number(error.position) : 0;
            const around = pos
              ? statement.slice(Math.max(0, pos - 48), pos + 48)
              : statement.slice(0, 160);
            console.error(`migrate: failed ${file}: ${error?.message}`);
            console.error(`migrate: sql around error: ${around}`);
            throw error;
          }
        }
      }
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
} catch (error) {
  console.error("migrate: continuing build after error:", error?.message);
} finally {
  await client.end();
}
