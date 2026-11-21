import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import {
  campaignRecipients,
  campaigns,
  subscriptions,
} from "@/db/schema";
import { requireUser } from "@/lib/auth/session";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    await requireUser("campaigns");
    const { id } = await ctx.params;
    const campaign = await db.query.campaigns.findFirst({
      where: eq(campaigns.id, id),
    });
    if (!campaign) {
      return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    }

    if (!campaign.topicId) {
      return NextResponse.json({ error: "У рассылки нет темы" }, { status: 400 });
    }
    const conditions = [
      isNull(subscriptions.revokedAt),
      eq(subscriptions.topicId, campaign.topicId),
    ];
    if (campaign.channel) {
      conditions.push(eq(subscriptions.channel, campaign.channel));
    }
    const subs = await db
      .select()
      .from(subscriptions)
      .where(and(...conditions));

    // rebuild queue for preview
    await db
      .delete(campaignRecipients)
      .where(eq(campaignRecipients.campaignId, id));

    for (const sub of subs) {
      await db
        .insert(campaignRecipients)
        .values({
          campaignId: id,
          contactId: sub.contactId,
          channel: sub.channel,
          status: "queued",
        })
        .onConflictDoNothing();
    }

    await db
      .update(campaigns)
      .set({ status: "ready", updatedAt: new Date() })
      .where(eq(campaigns.id, id));

    return NextResponse.json({ count: subs.length });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ошибка" },
      { status: 400 },
    );
  }
}
