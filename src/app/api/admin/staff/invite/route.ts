import { createHash, randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { invitations, users } from "@/db/schema";
import { hashPassword, requireUser } from "@/lib/auth/session";

export async function POST(req: Request) {
  try {
    const me = await requireUser();
    if (!me.isOwner) {
      return NextResponse.json({ error: "Только владелец" }, { status: 403 });
    }
    const body = await req.json();
    const token = randomBytes(24).toString("hex");
    const password = body.password || randomBytes(6).toString("hex");

    await db.insert(users).values({
      email: String(body.email).toLowerCase(),
      name: body.name || body.email,
      passwordHash: await hashPassword(password),
      isOwner: false,
      isActive: true,
      permissions: body.permissions,
    });

    await db.insert(invitations).values({
      email: String(body.email).toLowerCase(),
      tokenHash: createHash("sha256").update(token).digest("hex"),
      permissions: body.permissions,
      invitedById: me.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      acceptedAt: new Date(),
    });

    return NextResponse.json({
      inviteToken: token,
      temporaryPassword: password,
    });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ошибка" },
      { status: 400 },
    );
  }
}
