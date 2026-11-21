import { createHash, randomBytes } from "crypto";
import { cookies, headers } from "next/headers";
import { and, eq, gt, isNull } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db, hasDatabase } from "@/db/client";
import { ensureSchema } from "@/db/ensure-schema";
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

async function cookieSecure() {
  const h = await headers();
  const proto = (h.get("x-forwarded-proto") || "").split(",")[0].trim();
  const host = (h.get("host") || "").split(":")[0];
  if (proto === "https") return true;
  if (host === "127.0.0.1" || host === "localhost") return false;
  return process.env.NODE_ENV === "production";
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
    secure: await cookieSecure(),
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
  if (!hasDatabase()) return null;
  try {
    await ensureSchema();
  } catch {
    return null;
  }
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
