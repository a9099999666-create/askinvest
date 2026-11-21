import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import {
  channelIdentities,
  contacts,
  leadMarkers,
  leads,
  messages,
  providerEvents,
  threads,
} from "@/db/schema";
import { enqueueJob } from "@/lib/jobs";
import type { ChannelKind, NormalizedInbound } from "./types";

export async function processInboundEvent(
  channel: ChannelKind,
  inbound: NormalizedInbound,
) {
  const inserted = await db
    .insert(providerEvents)
    .values({
      channel,
      externalEventId: inbound.externalEventId,
      payload: inbound.raw,
      processedAt: new Date(),
    })
    .onConflictDoNothing()
    .returning({ id: providerEvents.id });

  if (inserted.length === 0) {
    return { duplicated: true as const };
  }

  let contactId: string | undefined;
  const existingIdentity = await db.query.channelIdentities.findFirst({
    where: and(
      eq(channelIdentities.channel, channel),
      eq(channelIdentities.externalId, inbound.externalUserId),
    ),
  });

  if (existingIdentity) {
    contactId = existingIdentity.contactId;
    if (inbound.displayName) {
      await db
        .update(contacts)
        .set({
          displayName: inbound.displayName,
          updatedAt: new Date(),
        })
        .where(and(eq(contacts.id, contactId), isNull(contacts.displayName)));
    }
  } else {
    const [contact] = await db
      .insert(contacts)
      .values({
        displayName: inbound.displayName || null,
      })
      .returning();
    contactId = contact.id;
    await db.insert(channelIdentities).values({
      contactId,
      channel,
      externalId: inbound.externalUserId,
      meta: {},
    });
  }

  let leadId: string | undefined;
  let linked = false;

  if (inbound.markerCode) {
    const marker = await db.query.leadMarkers.findFirst({
      where: and(
        eq(leadMarkers.code, inbound.markerCode.toUpperCase()),
        eq(leadMarkers.channel, channel),
        isNull(leadMarkers.consumedAt),
        gt(leadMarkers.expiresAt, new Date()),
      ),
    });
    if (marker) {
      leadId = marker.leadId;
      linked = true;
      await db
        .update(leadMarkers)
        .set({ consumedAt: new Date(), updatedAt: new Date() })
        .where(eq(leadMarkers.id, marker.id));
      await db
        .update(leads)
        .set({
          contactId,
          chatLinkStatus: "linked",
          updatedAt: new Date(),
        })
        .where(eq(leads.id, leadId));
    }
  }

  let thread = await db.query.threads.findFirst({
    where: and(
      eq(threads.channel, channel),
      eq(threads.externalThreadId, inbound.externalThreadId),
    ),
  });

  if (!thread) {
    const [created] = await db
      .insert(threads)
      .values({
        channel,
        externalThreadId: inbound.externalThreadId,
        contactId,
        leadId: leadId || null,
        mode: "bot",
        unreadCount: 1,
        lastMessageAt: new Date(),
        lastPreview: inbound.text.slice(0, 200),
      })
      .returning();
    thread = created;
  } else {
    await db
      .update(threads)
      .set({
        contactId: contactId || thread.contactId,
        leadId: leadId || thread.leadId,
        unreadCount: (thread.unreadCount || 0) + 1,
        lastMessageAt: new Date(),
        lastPreview: inbound.text.slice(0, 200),
        updatedAt: new Date(),
      })
      .where(eq(threads.id, thread.id));
  }

  if (!linked && !leadId) {
    // входящее без маркера — отдельная ветка, оператор свяжет вручную
    await db
      .update(threads)
      .set({ updatedAt: new Date() })
      .where(eq(threads.id, thread.id));
  }

  await db
    .insert(messages)
    .values({
      threadId: thread.id,
      authorType: "client",
      body: inbound.text,
      status: "delivered",
      externalMessageId: inbound.externalMessageId,
      meta: { markerLinked: linked },
    })
    .onConflictDoNothing();

  const fresh = await db.query.threads.findFirst({
    where: eq(threads.id, thread.id),
  });

  if (fresh?.mode === "bot") {
    await enqueueJob({
      type: "bot.auto_reply",
      payload: { threadId: thread.id, inboundText: inbound.text },
      idempotencyKey: `bot-reply:${inbound.externalMessageId}`,
      runAfter: new Date(Date.now() + 800),
    });
  }

  return { duplicated: false as const, threadId: thread.id, linked };
}
