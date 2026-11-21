import { NextResponse } from "next/server";
import { count } from "drizzle-orm";
import { db, hasDatabase } from "@/db/client";
import { users } from "@/db/schema";
import { OWNER_PERMISSIONS } from "@/lib/auth/permissions";
import { authorizeOwnerSetup } from "@/lib/auth/setupGate";
import { createSession, hashPassword } from "@/lib/auth/session";
import { seedStarterCatalog } from "@/lib/content/seed-catalog";
import { ensureSchema } from "@/db/ensure-schema";

export async function POST(req: Request) {
  if (!hasDatabase()) {
    return NextResponse.json(
      { error: "База данных ещё не подключена" },
      { status: 503 },
    );
  }
  await ensureSchema();

  const body = (await req.json()) as {
    email?: string;
    name?: string;
    password?: string;
    setupToken?: string;
  };

  if (!(await authorizeOwnerSetup(req, body.setupToken))) {
    return NextResponse.json(
      { error: "Первая настройка доступна только администратору приложения." },
      { status: 401 },
    );
  }

  const [{ value: userCount }] = await db
    .select({ value: count() })
    .from(users);
  if (Number(userCount) > 0) {
    return NextResponse.json(
      { error: "Владелец уже создан. Войдите через /cabinet/login." },
      { status: 403 },
    );
  }

  const email = body.email?.trim().toLowerCase();
  const name = body.name?.trim() || "Владелец";
  const password = body.password || "";

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Укажите email" }, { status: 400 });
  }
  if (password.length < 12) {
    return NextResponse.json(
      { error: "Пароль не короче 12 символов" },
      { status: 400 },
    );
  }

  const [user] = await db
    .insert(users)
    .values({
      email,
      name,
      passwordHash: await hashPassword(password),
      isOwner: true,
      isActive: true,
      permissions: OWNER_PERMISSIONS,
    })
    .returning();

  try {
    await seedStarterCatalog(user.id);
  } catch (error) {
    console.error("seedStarterCatalog", error);
  }

  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
