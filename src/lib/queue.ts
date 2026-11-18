import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import {
  campaignRecipients,
  campaigns,
  channelIdentities,
  subscriptions,
  threads,
} from "@/db/schema";
import { handleBotAutoReply } from "@/lib/bot/autoReply";
import { getAdapter, type ChannelKind } from "@/lib/channels";
import { claimNextJob, completeJob, enqueueJob, failJob } from "@/lib/jobs";

async function processCampaignTick(campaignId: string) {
  const campaign = await db.query.campaigns.findFirst({
    where: eq(campaigns.id, campaignId),
  });
  if (!campaign || campaign.status !== "running") return;

  const recipient = await db.query.campaignRecipients.findFirst({
    where: and(
      eq(campaignRecipients.campaignId, campaignId),
      eq(campaignRecipients.status, "queued"),
    ),
  });

  if (!recipient) {
    await db
      .update(campaigns)
      .set({ status: "done", finishedAt: new Date(), updatedAt: new Date() })
      .where(eq(campaigns.id, campaignId));
    return;
  }

  if (!campaign.topicId) {
    await db
      .update(campaignRecipients)
      .set({
        status: "cancelled",
        error: "У рассылки нет темы",
        updatedAt: new Date(),
      })
      .where(eq(campaignRecipients.id, recipient.id));
    return;
  }

  const sub = await db.query.subscriptions.findFirst({
    where: and(
      eq(subscriptions.contactId, recipient.contactId),
      eq(subscriptions.channel, recipient.channel),
      eq(subscriptions.topicId, campaign.topicId),
      isNull(subscriptions.revokedAt),
    ),
  });

  if (!sub) {
    await db
      .update(campaignRecipients)
      .set({
        status: "cancelled",
        error: "Нет активного согласия",
        updatedAt: new Date(),
      })
      .where(eq(campaignRecipients.id, recipient.id));
    return;
  }

  const identity = await db.query.channelIdentities.findFirst({
    where: and(
      eq(channelIdentities.contactId, recipient.contactId),
      eq(channelIdentities.channel, recipient.channel),
    ),
  });

  if (!identity) {
    await db
      .update(campaignRecipients)
      .set({
        status: "failed",
        error: "Нет канала у контакта",
        updatedAt: new Date(),
      })
      .where(eq(campaignRecipients.id, recipient.id));
    return;
  }

  const adapter = getAdapter(recipient.channel as ChannelKind);
  try {
    const result = await adapter.sendText({
      externalThreadId: identity.externalId,
      externalUserId: identity.externalId,
      text: campaign.body,
    });
    await db
      .update(campaignRecipients)
      .set({
        status: result.status === "failed" ? "failed" : "accepted",
        error: result.error || null,
        sentAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(campaignRecipients.id, recipient.id));
  } catch (e) {
    await db
      .update(campaignRecipients)
      .set({
        status: "failed",
        error: e instanceof Error ? e.message : "send error",
        updatedAt: new Date(),
      })
      .where(eq(campaignRecipients.id, recipient.id));
  }
}

async function handleJob(job: {
  id: string;
  type: string;
  payload: Record<string, unknown>;
}) {
  if (job.type === "bot.auto_reply") {
    const threadId = String(job.payload.threadId || "");
    const inboundText = String(job.payload.inboundText || "");
    const thread = await db.query.threads.findFirst({
      where: eq(threads.id, threadId),
    });
    if (!thread || thread.mode !== "bot") {
      await completeJob(job.id);
      return;
    }
    await handleBotAutoReply(threadId, inboundText);
    await completeJob(job.id);
    return;
  }

  if (job.type === "campaign.tick") {
    await processCampaignTick(String(job.payload.campaignId || ""));
    const campaign = await db.query.campaigns.findFirst({
      where: eq(campaigns.id, String(job.payload.campaignId || "")),
    });
    if (campaign?.status === "running") {
      await enqueueJob({
        type: "campaign.tick",
        payload: { campaignId: campaign.id },
        runAfter: new Date(Date.now() + 300),
      });
    }
    await completeJob(job.id);
    return;
  }

  await completeJob(job.id);
}

export async function drainJobs(limit = 3) {
  let ran = 0;
  while (ran < limit) {
    const job = await claimNextJob();
    if (!job) break;
    try {
      await handleJob(job);
    } catch (e) {
      await failJob(job.id, e instanceof Error ? e.message : "job failed", true);
    }
    ran += 1;
  }
  return ran;
}
