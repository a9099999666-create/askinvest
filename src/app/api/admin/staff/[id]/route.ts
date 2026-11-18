import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { requireUser, revokeUserSessions } from "@/lib/auth/session";

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
    const body = await req.json();
    const patch: Partial<typeof users.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (typeof body.isActive === "boolean") patch.isActive = body.isActive;
    if (body.permissions) patch.permissions = body.permissions;

    const [updated] = await db
      .update(users)
      .set(patch)
      .where(eq(users.id, id))
      .returning();

    if (body.isActive === false) {
      await revokeUserSessions(id);
    }

    return NextResponse.json({ user: updated });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ошибка" },
      { status: 400 },
    );
  }
}
