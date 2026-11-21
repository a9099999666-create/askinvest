import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { messages, threads } from "@/db/schema";
import { getAdapter, type ChannelKind } from "@/lib/channels";
import { requireUser } from "@/lib/auth/session";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser("leads");
    const { id } = await ctx.params;
    const body = (await req.json()) as {
      body?: string;
      isInternal?: boolean;
    };
    if (!body.body?.trim()) {
      return NextResponse.json({ error: "Пустое сообщение" }, { status: 400 });
    }

    const thread = await db.query.threads.findFirst({
      where: eq(threads.id, id),
    });
    if (!thread) {
      return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    }

    let status: "delivered" | "accepted" | "failed" = "delivered";
    let externalMessageId: string | null = null;
    let meta: Record<string, unknown> = {};

    if (!body.isInternal) {
      const adapter = getAdapter(thread.channel as ChannelKind);
      const send = await adapter.sendText({
        externalThreadId: thread.externalThreadId || "",
        externalUserId: "",
        text: body.body,
      });
      status = send.status === "failed" ? "failed" : "accepted";
      externalMessageId = send.externalMessageId || null;
      if (send.error) meta = { error: send.error };
    }

    const [msg] = await db
      .insert(messages)
      .values({
        threadId: id,
        authorType: body.isInternal ? "staff" : "staff",
        authorUserId: user.id,
        body: body.body,
        isInternal: Boolean(body.isInternal),
        status,
        externalMessageId,
        meta,
      })
      .returning();

    await db
      .update(threads)
      .set({
        lastMessageAt: new Date(),
        lastPreview: body.body.slice(0, 200),
        unreadCount: 0,
        updatedAt: new Date(),
      })
      .where(eq(threads.id, id));

    return NextResponse.json({ message: msg });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ошибка" },
      { status: 400 },
    );
  }
}
