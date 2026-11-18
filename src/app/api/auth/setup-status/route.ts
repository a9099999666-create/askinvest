import { count } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireIdentity } from "../../../../../cursor/identity";
import { db } from "@/db/client";
import { users } from "@/db/schema";

export async function GET(req: Request) {
  const identity = await requireIdentity(req);
  if (identity instanceof Response) return identity;
  const [{ value }] = await db.select({ value: count() }).from(users);
  return NextResponse.json({ needsSetup: Number(value) === 0 });
}
