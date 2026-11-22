import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { leads, threads } from "@/db/schema";
import { LeadActions } from "@/components/admin/LeadActions";
import { PageTitle } from "@/components/admin/PageTitle";
import { listPublicChannelStatus } from "@/lib/channels";
import { leadStageLabel } from "@/lib/crm/stages";
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
      <dl className="cabinet-card mt-5 grid gap-4 p-5 text-sm sm:grid-cols-2">
        <div className="sm:col-span-2">
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/40">Интерес</dt>
          <dd className="mt-1 font-semibold text-ink">
            {lead.serviceTitleSnapshot || lead.propertyTitleSnapshot || "—"}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/40">Вопрос</dt>
          <dd className="mt-1 text-ink/80">{lead.question}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/40">Клиент</dt>
          <dd className="mt-1">{lead.visitorName || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/40">Канал</dt>
          <dd className="mt-1">{channelLabel}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/40">Телефон</dt>
          <dd className="mt-1">{lead.visitorPhone || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/40">Email</dt>
          <dd className="mt-1 break-all">{lead.visitorEmail || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/40">Стадия</dt>
          <dd className="mt-1">{leadStageLabel(lead.stage)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/40">Источник</dt>
          <dd className="mt-1 break-all">{lead.sourcePage}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/40">Связь с чатом</dt>
          <dd className="mt-1">{lead.chatLinkStatus}</dd>
        </div>
        {thread ? (
          <div className="sm:col-span-2">
            <Link className="font-semibold text-brand-cyan" href={`/cabinet/inbox?thread=${thread.id}`}>
              Открыть диалог →
            </Link>
          </div>
        ) : null}
      </dl>
      <LeadActions
        leadId={lead.id}
        stage={lead.stage}
        note={lead.note || ""}
        nextAction={lead.nextAction || ""}
      />
    </div>
  );
}
