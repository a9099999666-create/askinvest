import { NextResponse } from "next/server";
import { count } from "drizzle-orm";
import { requireIdentity } from "../../../../cursor/identity";
import { db } from "@/db/client";
import { siteSettings, subscriptionTopics, users } from "@/db/schema";
import { OWNER_PERMISSIONS } from "@/lib/auth/permissions";
import { createSession, hashPassword } from "@/lib/auth/session";

export async function POST(req: Request) {
  const identity = await requireIdentity(req);
  if (identity instanceof Response) return identity;

  const [{ value: userCount }] = await db
    .select({ value: count() })
    .from(users);
  if (Number(userCount) > 0) {
    return NextResponse.json(
      { error: "Владелец уже создан. Войдите через /admin/login." },
      { status: 403 },
    );
  }

  const body = (await req.json()) as {
    email?: string;
    name?: string;
    password?: string;
  };
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

  await db
    .insert(siteSettings)
    .values({
      id: 1,
      contactsHtml:
        "<p>АСКИНВЕСТ</p><p>Связь через форму на сайте или мессенджеры.</p>",
    })
    .onConflictDoNothing();

  const topic = await db.query.subscriptionTopics.findFirst();
  if (!topic) {
    await db.insert(subscriptionTopics).values({
      slug: "rent",
      title: "Аренда",
      consentText:
        "Согласие на получение информационных сообщений об аренде коммерческой недвижимости.",
      consentVersion: "1",
    });
  }

  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
