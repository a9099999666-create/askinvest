import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { messages, threads } from "@/db/schema";
import { requireUser } from "@/lib/auth/session";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser("leads");
    const { id } = await ctx.params;
    const [updated] = await db
      .update(threads)
      .set({
        mode: "bot",
        operatorId: null,
        updatedAt: new Date(),
      })
      .where(eq(threads.id, id))
      .returning();
    await db.insert(messages).values({
      threadId: id,
      authorType: "system",
      body: `${user.name} вернул(а) диалог боту.`,
      status: "delivered",
    });
    return NextResponse.json({ thread: updated });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ошибка" },
      { status: 400 },
    );
  }
}
