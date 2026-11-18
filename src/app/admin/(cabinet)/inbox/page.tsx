import { asc, desc, eq } from "drizzle-orm";
import { InboxClient } from "@/components/admin/InboxClient";
import { db } from "@/db/client";
import { leads, messages, threads } from "@/db/schema";
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
    .select()
    .from(threads)
    .orderBy(desc(threads.lastMessageAt));
  const selectedId = sp.thread || allThreads[0]?.id;
  const msgs = selectedId
    ? await db
        .select()
        .from(messages)
        .where(eq(messages.threadId, selectedId))
        .orderBy(asc(messages.createdAt))
    : [];
  const thread = allThreads.find((t) => t.id === selectedId);
  const lead = thread?.leadId
    ? await db.query.leads.findFirst({ where: eq(leads.id, thread.leadId) })
    : null;

  return (
    <InboxClient
      currentUserId={user!.id}
      initialThreadId={selectedId}
      threads={allThreads.map((t) => ({
        id: t.id,
        channel: t.channel,
        mode: t.mode,
        lastPreview: t.lastPreview,
        lastMessageAt: t.lastMessageAt
          ? new Date(t.lastMessageAt).toISOString()
          : null,
        unreadCount: t.unreadCount,
        leadId: t.leadId,
        operatorId: t.operatorId,
      }))}
      messages={msgs.map((m) => ({
        id: m.id,
        authorType: m.authorType,
        body: m.body,
        isInternal: m.isInternal,
        createdAt: new Date(m.createdAt).toISOString(),
        status: m.status,
      }))}
      lead={
        lead
          ? {
              id: lead.id,
              question: lead.question,
              stage: lead.stage,
              channel: lead.channel,
              serviceTitleSnapshot: lead.serviceTitleSnapshot,
              propertyTitleSnapshot: lead.propertyTitleSnapshot,
              note: lead.note,
            }
          : null
      }
    />
  );
}
