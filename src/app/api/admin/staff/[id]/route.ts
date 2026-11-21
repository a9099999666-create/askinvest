import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { hashPassword, requireUser, revokeUserSessions } from "@/lib/auth/session";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const me = await requireUser();
    if (!me.isOwner) {
      return NextResponse.json({ error: "Только владелец" }, { status: 403 });
    }
    const { id } = await ctx.params;
    const target = await db.query.users.findFirst({ where: eq(users.id, id) });
    if (!target) {
      return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    }
    if (target.isOwner) {
      return NextResponse.json(
        { error: "Владельца нельзя менять из списка сотрудников" },
        { status: 403 },
      );
    }
    const body = await req.json();
    const patch: Partial<typeof users.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (typeof body.isActive === "boolean") patch.isActive = body.isActive;
    if (body.permissions) patch.permissions = body.permissions;
    if (typeof body.password === "string") {
      if (body.password.trim().length < 8) {
        return NextResponse.json(
          { error: "Пароль не короче 8 символов" },
          { status: 400 },
        );
      }
      patch.passwordHash = await hashPassword(body.password.trim());
    }

    const [updated] = await db
      .update(users)
      .set(patch)
      .where(eq(users.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    }

    if (body.isActive === false || patch.passwordHash) {
      await revokeUserSessions(id);
    }

    return NextResponse.json({
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        isOwner: updated.isOwner,
        isActive: updated.isActive,
        permissions: updated.permissions,
      },
    });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ошибка" },
      { status: 400 },
    );
  }
}
