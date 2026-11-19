import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { PageTitle } from "@/components/admin/PageTitle";
import { db } from "@/db/client";
import { leads } from "@/db/schema";
import { can } from "@/lib/auth/permissions";
import { requirePageAccess } from "@/lib/auth/guard";
import { loadMaterials } from "@/lib/content/materials";

export const dynamic = "force-dynamic";

export default async function CabinetHome() {
  const user = await requirePageAccess();
  const hello = greeting();
  const first = user.name.split(/\s+/)[0] || user.name;
  const showLeads = can(user, "leads");
  const showContent = can(user, "editContent");

  const recentLeads = showLeads
    ? await db.select().from(leads).orderBy(desc(leads.createdAt)).limit(6)
    : [];
  const newLeads = showLeads
    ? await db.select({ id: leads.id }).from(leads).where(eq(leads.stage, "new"))
    : [];
  const newCount = newLeads.length;
  const materials = showContent ? await loadMaterials() : [];
  const review = materials.filter((item) => item.status === "review");
  const drafts = materials.filter((item) => item.status === "draft");
  const published = materials.filter((item) => item.status === "published");

  return (
    <div>
      <PageTitle title={`${hello}, ${first}`} />
      <p className="mt-3 max-w-xl text-ink/60">
        Короткий пульс кабинета: новые обращения и материалы, которые ждут вас.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {showLeads ? (
          <Stat href="/admin/leads" label="Новые заявки" value={String(newCount)} />
        ) : null}
        {showContent ? (
          <>
            <Stat href="/admin/services" label="На проверке" value={String(review.length)} />
            <Stat href="/admin/services" label="Опубликовано" value={String(published.length)} />
          </>
        ) : null}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {showLeads ? (
          <section className="rounded-[28px] bg-white p-5 shadow-panel">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-ink">Последние обращения</h2>
              <Link href="/admin/leads" className="text-sm font-semibold text-brand-blue">
                Все заявки
              </Link>
            </div>
            <ul className="mt-3 space-y-2">
              {recentLeads.map((lead) => (
                <li key={lead.id}>
                  <Link
                    href={`/admin/leads/${lead.id}`}
                    className="block rounded-2xl border border-slate-100 px-3 py-3 hover:border-sky-200"
                  >
                    <div className="text-sm font-semibold text-ink">
                      {lead.serviceTitleSnapshot ||
                        lead.propertyTitleSnapshot ||
                        "Общий вопрос"}
                    </div>
                    <div className="mt-1 line-clamp-2 text-xs text-ink/55">{lead.question}</div>
                  </Link>
                </li>
              ))}
              {recentLeads.length === 0 ? (
                <li className="py-6 text-sm text-ink/45">Пока тишина — заявок нет.</li>
              ) : null}
            </ul>
          </section>
        ) : null}

        {showContent ? (
          <section className="rounded-[28px] bg-white p-5 shadow-panel">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-ink">Черновики и проверка</h2>
              <Link href="/admin/services" className="text-sm font-semibold text-brand-blue">
                К материалам
              </Link>
            </div>
            <ul className="mt-3 space-y-2">
              {[...review, ...drafts].slice(0, 6).map((item) => (
                <li key={`${item.kind}-${item.id}`}>
                  <Link
                    href={item.href}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 px-3 py-3 hover:border-sky-200"
                  >
                    <span>
                      <span className="block text-sm font-semibold text-ink">{item.title}</span>
                      <span className="text-xs text-ink/50">
                        {item.kind === "service" ? "Услуга" : "Объект"} ·{" "}
                        {item.status === "review" ? "на проверке" : "черновик"}
                      </span>
                    </span>
                    <span className="text-[#ff3142]" aria-hidden>
                      →
                    </span>
                  </Link>
                </li>
              ))}
              {review.length + drafts.length === 0 ? (
                <li className="py-6 text-sm text-ink/45">Все материалы в порядке.</li>
              ) : null}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function greeting() {
  const hour = Number(
    new Intl.DateTimeFormat("ru-RU", {
      timeZone: "Europe/Moscow",
      hour: "numeric",
      hour12: false,
    }).format(new Date()),
  );
  if (hour < 12) return "Доброе утро";
  if (hour < 18) return "Добрый день";
  return "Добрый вечер";
}

function Stat({ href, label, value }: { href: string; label: string; value: string }) {
  return (
    <Link href={href} className="rounded-[28px] bg-white p-5 shadow-panel">
      <div className="text-sm text-ink/50">{label}</div>
      <div className="mt-1 font-display text-3xl font-bold text-ink">{value}</div>
    </Link>
  );
}
