import { count } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, hasDatabase } from "@/db/client";
import { users } from "@/db/schema";
import { ensureSchema } from "@/db/ensure-schema";

export async function GET() {
  if (!hasDatabase()) {
    return NextResponse.json({ needsSetup: true, database: false });
  }
  try {
    await ensureSchema();
    const [{ value }] = await db.select({ value: count() }).from(users);
    return NextResponse.json({ needsSetup: Number(value) === 0, database: true });
  } catch (error) {
    console.error("setup-status", error);
    return NextResponse.json({ needsSetup: true, database: true });
  }
}
