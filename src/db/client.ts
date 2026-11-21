import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export function connectionString() {
  return (
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    process.env.POSTGRES_PRISMA_URL?.trim() ||
    ""
  );
}

export function hasDatabase() {
  return Boolean(connectionString());
}

const globalForDb = globalThis as unknown as {
  sql?: ReturnType<typeof postgres>;
};

function createSql() {
  const url = connectionString();
  if (!url) {
    throw new Error("DATABASE_URL is required");
  }
  return postgres(url, {
    max: process.env.VERCEL ? 1 : 3,
    prepare: false,
    connect_timeout: 5,
    idle_timeout: 20,
  });
}

export const sql = (globalForDb.sql ??= hasDatabase()
  ? createSql()
  : (undefined as unknown as ReturnType<typeof postgres>));

if (sql) {
  globalForDb.sql = sql;
}

export const db = hasDatabase()
  ? drizzle(sql, { schema })
  : (null as unknown as ReturnType<typeof drizzle<typeof schema>>);
