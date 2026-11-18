import { count } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { users } from "@/db/schema";

export async function GET() {
  const [{ value }] = await db.select({ value: count() }).from(users);
  return NextResponse.json({ needsSetup: Number(value) === 0 });
}
