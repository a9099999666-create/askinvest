import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { leads } from "@/db/schema";
import { requireUser } from "@/lib/auth/session";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    await requireUser("leads");
    const { id } = await ctx.params;
    const body = await req.json();
    const [updated] = await db
      .update(leads)
      .set({
        stage: body.stage,
        note: body.note,
        nextAction: body.nextAction,
        updatedAt: new Date(),
      })
      .where(eq(leads.id, id))
      .returning();
    return NextResponse.json({ lead: updated });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ошибка" },
      { status: 400 },
    );
  }
}
