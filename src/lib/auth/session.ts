import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { and, eq, gt, isNull } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/db/client";
import { sessions, users } from "@/db/schema";
import {
  can,
  type Permissions,
  type SessionUser,
} from "@/lib/auth/permissions";

const COOKIE = "askinvest_session";
const SESSION_DAYS = 14;

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(sessions).values({
    userId,
    tokenHash: hashToken(token),
    expiresAt,
  });
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
  return token;
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    await db
      .update(sessions)
      .set({ revokedAt: new Date(), updatedAt: new Date() })
      .where(eq(sessions.tokenHash, hashToken(token)));
  }
  jar.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export async function revokeUserSessions(userId: string) {
  await db
    .update(sessions)
    .set({ revokedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;

  const rows = await db
    .select({
      sessionId: sessions.id,
      userId: users.id,
      email: users.email,
      name: users.name,
      isOwner: users.isOwner,
      isActive: users.isActive,
      permissions: users.permissions,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(
        eq(sessions.tokenHash, hashToken(token)),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, new Date()),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row || !row.isActive) return null;

  return {
    id: row.userId,
    email: row.email,
    name: row.name,
    isOwner: row.isOwner,
    isActive: row.isActive,
    permissions: row.permissions as Permissions,
  };
}

export async function requireUser(permission?: keyof Permissions) {
  const user = await getSessionUser();
  if (!user) {
    throw new Response(JSON.stringify({ error: "Требуется вход" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (permission && !can(user, permission)) {
    throw new Response(JSON.stringify({ error: "Недостаточно прав" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  return user;
}
