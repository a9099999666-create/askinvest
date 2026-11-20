import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { leads, threads } from "@/db/schema";
import { LeadActions } from "@/components/admin/LeadActions";
import { PageTitle } from "@/components/admin/PageTitle";
import { listPublicChannelStatus } from "@/lib/channels";
import { requirePageAccess } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePageAccess("leads");
  const { id } = await params;
  const lead = await db.query.leads.findFirst({ where: eq(leads.id, id) });
  if (!lead) notFound();
  const thread = await db.query.threads.findFirst({
    where: eq(threads.leadId, id),
  });
  const liveChannels = new Set(
    listPublicChannelStatus()
      .filter((item) => item.configured)
      .map((item) => item.kind),
  );
  const channelLabel = liveChannels.has(lead.channel)
    ? lead.channel
    : "Форма на сайте";

  return (
    <div className="max-w-3xl">
      <PageTitle title="Заявка" />
      <div className="mt-4 space-y-2 rounded-2xl bg-white/80 p-5 text-sm">
        <p>
          <strong>Заинтересовала услуга:</strong>{" "}
          {lead.serviceTitleSnapshot || lead.propertyTitleSnapshot || "—"}
        </p>
        <p>
          <strong>Что спросил:</strong> {lead.question}
        </p>
        <p>
          <strong>Куда ответить:</strong>{" "}
          {lead.visitorPhone || lead.visitorEmail || "—"}
        </p>
        <p>
          <strong>Канал:</strong> {channelLabel}
        </p>
        <p>
          <strong>Стадия:</strong> {lead.stage}
        </p>
        <p>
          <strong>Связь с чатом:</strong> {lead.chatLinkStatus}
        </p>
        <p>
          <strong>Источник:</strong> {lead.sourcePage}
        </p>
        <p>
          <strong>Клиент:</strong> {lead.visitorName || "—"}
        </p>
        <p>
          <strong>Телефон:</strong> {lead.visitorPhone || "—"}
        </p>
        <p>
          <strong>Email:</strong> {lead.visitorEmail || "—"}
        </p>
        {thread && (
          <p>
            <Link className="text-brand-blue" href={`/admin/inbox?thread=${thread.id}`}>
              Открыть диалог
            </Link>
          </p>
        )}
      </div>
      <LeadActions
        leadId={lead.id}
        stage={lead.stage}
        note={lead.note || ""}
        nextAction={lead.nextAction || ""}
      />
    </div>
  );
}
