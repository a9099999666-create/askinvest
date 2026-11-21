import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { messages, threads } from "@/db/schema";
import { requireUser } from "@/lib/auth/session";
import { cancelPendingJobsForThread } from "@/lib/jobs";

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
        mode: "human",
        operatorId: user.id,
        updatedAt: new Date(),
      })
      .where(
        and(eq(threads.id, id), eq(threads.mode, "bot")),
      )
      .returning();

    if (!updated) {
      const current = await db.query.threads.findFirst({
        where: eq(threads.id, id),
      });
      return NextResponse.json(
        {
          error: "Диалог уже занят",
          operatorId: current?.operatorId,
        },
        { status: 409 },
      );
    }

    await cancelPendingJobsForThread(id);
    await db.insert(messages).values({
      threadId: id,
      authorType: "system",
      body: `${user.name} взял(а) диалог. Автоответы отключены.`,
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
