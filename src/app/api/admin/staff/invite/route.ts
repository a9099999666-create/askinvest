import { createHash, randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { invitations, users } from "@/db/schema";
import { EMPTY_PERMISSIONS, OWNER_PERMISSIONS } from "@/lib/auth/permissions";
import { hashPassword, requireUser } from "@/lib/auth/session";

export async function POST(req: Request) {
  try {
    const me = await requireUser();
    if (!me.isOwner) {
      return NextResponse.json({ error: "Только владелец" }, { status: 403 });
    }
    const body = (await req.json()) as {
      email?: string;
      name?: string;
      password?: string;
      permissions?: Partial<typeof OWNER_PERMISSIONS>;
    };
    const email = body.email?.trim().toLowerCase() || "";
    const name = body.name?.trim() || email.split("@")[0] || "Сотрудник";
    const password = body.password?.trim() || "";
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Укажите рабочий email" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Пароль сотрудника не короче 8 символов" },
        { status: 400 },
      );
    }
    const existing = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    if (existing) {
      return NextResponse.json(
        { error: "Пользователь с таким email уже есть" },
        { status: 409 },
      );
    }

    const permissions = {
      ...EMPTY_PERMISSIONS,
      ...body.permissions,
    };

    const [user] = await db
      .insert(users)
      .values({
        email,
        name,
        passwordHash: await hashPassword(password),
        isOwner: false,
        isActive: true,
        permissions,
      })
      .returning();

    const token = randomBytes(24).toString("hex");
    await db.insert(invitations).values({
      email,
      tokenHash: createHash("sha256").update(token).digest("hex"),
      permissions,
      invitedById: me.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      acceptedAt: new Date(),
    });

    return NextResponse.json({
      ok: true,
      login: user.email,
      temporaryPassword: password,
      inviteToken: token,
    });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ошибка" },
      { status: 400 },
    );
  }
}
