import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { createSession, verifyPassword } from "@/lib/auth/session";

export async function POST(req: Request) {
  const body = (await req.json()) as { email?: string; password?: string };
  if (!body.email || !body.password) {
    return NextResponse.json({ error: "Укажите email и пароль" }, { status: 400 });
  }
  const user = await db.query.users.findFirst({
    where: eq(users.email, body.email.toLowerCase()),
  });
  if (!user || !user.isActive) {
    return NextResponse.json({ error: "Неверный логин или пароль" }, { status: 401 });
  }
  const ok = await verifyPassword(body.password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Неверный логин или пароль" }, { status: 401 });
  }
  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
