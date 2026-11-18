import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { campaigns } from "@/db/schema";
import { requireUser } from "@/lib/auth/session";

export async function POST(req: Request) {
  try {
    const user = await requireUser("campaigns");
    const body = await req.json();
    const [row] = await db
      .insert(campaigns)
      .values({
        title: body.title,
        body: body.body,
        topicId: body.topicId || null,
        channel: body.channel || "test",
        status: "draft",
        createdById: user.id,
      })
      .returning();
    return NextResponse.json({ campaign: row });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ошибка" },
      { status: 400 },
    );
  }
}
