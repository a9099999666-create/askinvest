import { asc, desc, eq } from "drizzle-orm";
import { InboxClient } from "@/components/admin/InboxClient";
import { db } from "@/db/client";
import { contacts, leads, mediaAssets, messages, threads } from "@/db/schema";
import { requirePageAccess } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ thread?: string }>;
}) {
  const user = await requirePageAccess("leads");
  const sp = await searchParams;
  const allThreads = await db
    .select({
      id: threads.id,
      channel: threads.channel,
      mode: threads.mode,
      lastPreview: threads.lastPreview,
      lastMessageAt: threads.lastMessageAt,
      unreadCount: threads.unreadCount,
      leadId: threads.leadId,
      operatorId: threads.operatorId,
      contactName: contacts.displayName,
      visitorName: leads.visitorName,
    })
    .from(threads)
    .leftJoin(contacts, eq(threads.contactId, contacts.id))
    .leftJoin(leads, eq(threads.leadId, leads.id))
    .orderBy(desc(threads.lastMessageAt));

  const selectedId = sp.thread || allThreads[0]?.id;
  const msgs = selectedId
    ? await db
        .select({
          id: messages.id,
          authorType: messages.authorType,
          body: messages.body,
          isInternal: messages.isInternal,
          createdAt: messages.createdAt,
          status: messages.status,
          mediaId: messages.mediaId,
          mediaName: mediaAssets.originalName,
        })
        .from(messages)
        .leftJoin(mediaAssets, eq(messages.mediaId, mediaAssets.id))
        .where(eq(messages.threadId, selectedId))
        .orderBy(asc(messages.createdAt))
    : [];
  const thread = allThreads.find((item) => item.id === selectedId);
  const lead = thread?.leadId
    ? await db.query.leads.findFirst({ where: eq(leads.id, thread.leadId) })
    : null;

  return (
    <InboxClient
      currentUserId={user!.id}
      initialThreadId={selectedId}
      threads={allThreads.map((item) => ({
        id: item.id,
        channel: item.channel,
        mode: item.mode,
        lastPreview: item.lastPreview,
        lastMessageAt: item.lastMessageAt ? new Date(item.lastMessageAt).toISOString() : null,
        unreadCount: item.unreadCount,
        leadId: item.leadId,
        operatorId: item.operatorId,
        title: item.contactName || item.visitorName || "Клиент",
      }))}
      messages={msgs.map((message) => ({
        id: message.id,
        authorType: message.authorType,
        body: message.body,
        isInternal: message.isInternal,
        createdAt: new Date(message.createdAt).toISOString(),
        status: message.status,
        mediaId: message.mediaId,
        mediaName: message.mediaName,
      }))}
      lead={
        lead
          ? {
              id: lead.id,
              number: leadNumber(lead.id),
              question: lead.question,
              stage: lead.stage,
              channel: lead.channel,
              serviceTitleSnapshot: lead.serviceTitleSnapshot,
              propertyTitleSnapshot: lead.propertyTitleSnapshot,
              note: lead.note,
              visitorName: lead.visitorName,
            }
          : null
      }
    />
  );
}

function leadNumber(id: string) {
  const n = Number.parseInt(id.replace(/-/g, "").slice(0, 6), 16) % 9000;
  return String(1000 + n);
}
