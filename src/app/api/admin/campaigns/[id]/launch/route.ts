import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { campaigns } from "@/db/schema";
import { requireUser } from "@/lib/auth/session";
import { enqueueJob } from "@/lib/jobs";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    await requireUser("campaigns");
    const { id } = await ctx.params;
    await db
      .update(campaigns)
      .set({
        status: "running",
        startedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(campaigns.id, id));
    await enqueueJob({
      type: "campaign.tick",
      payload: { campaignId: id },
      idempotencyKey: `campaign-start:${id}:${Date.now()}`,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ошибка" },
      { status: 400 },
    );
  }
}
