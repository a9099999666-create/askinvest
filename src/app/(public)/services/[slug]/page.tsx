import Link from "next/link";
import { notFound } from "next/navigation";
import { DiscussForm } from "@/components/forms/DiscussForm";
import { CopyLink } from "@/components/public/CopyLink";
import { GlassFolder } from "@/components/public/GlassFolder";
import { listPublicChannelStatus } from "@/lib/channels";
import { getPublishedService, getServiceCards } from "@/lib/public/cache";

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  const items = await getServiceCards();
  return items.map((item) => ({ slug: item.slug }));
}

export default async function ServicePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lead?: string }>;
}) {
  const { slug } = await params;
  const service = await getPublishedService(slug);
  if (!service) notFound();
  const query = await searchParams;
  const notice = query.lead === "ok" || query.lead === "error" ? query.lead : undefined;
  const channelStatus = listPublicChannelStatus();
  const catalog = await getServiceCards();
  const related = catalog.filter((item) => item.id !== service.id).slice(0, 2);
  const prompts = (service.workItems || [])
    .map((item) => item.text)
    .filter((text) => text.length > 0 && text.length <= 42)
    .slice(0, 3);

  return (
    <div className="pt-2">
      <div className="grid items-start gap-x-8 gap-y-5 lg:grid-cols-2">
        <div className="order-1">
          <p className="text-sm text-ink/45">
            <Link href="/services" className="hover:text-ink">
              Услуги
            </Link>
            <span className="mx-2">›</span>
            {service.title}
          </p>
          <h1 className="mt-4 font-display text-5xl font-bold leading-[1.02] text-ink md:text-6xl">
            {service.title}
          </h1>
          <div className="mt-5 h-[3px] w-16 rounded-full bg-[#ff3142]" />
          <div className="mt-4">
            <CopyLink path={`/services/${service.slug}`} />
          </div>
        </div>

        <div className="order-2 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <GlassFolder className="mx-auto max-h-[180px] max-w-sm object-contain lg:max-h-[240px] lg:max-w-md" />
          <div className="relative z-10 lg:-mt-2">
            <DiscussForm
              serviceId={service.id}
              sourcePage={`/services/${service.slug}`}
              title="Обсудить задачу"
              variant="compact"
              channelStatus={channelStatus}
              notice={notice}
              actionLabel="Обсудить задачу"
              prompts={prompts.length ? prompts : ["Нужна эта услуга", "Есть срочный вопрос"]}
            />
          </div>
        </div>

        <div className="order-3 glass-panel rounded-[28px] p-5 md:p-6">
          <h2 className="text-2xl font-bold text-ink">Чем поможем:</h2>
          <ul className="mt-4 space-y-3">
            {(service.workItems || []).map((item, index) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-2xl border border-white bg-white/80 px-4 py-3"
              >
                <WorkIcon index={index} />
                <span className="flex-1 font-medium text-ink">{item.text}</span>
                <span className="text-[#ff3142]">→</span>
              </li>
            ))}
          </ul>
          {service.fullDescription ? (
            <p className="mt-4 text-sm leading-relaxed text-ink/60">{service.fullDescription}</p>
          ) : null}
        </div>
      </div>
      {related.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-ink">Ещё направления</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {related.map((item) => (
              <Link
                key={item.id}
                href={`/services/${item.slug}`}
                prefetch={false}
                className="glass-panel flex items-center justify-between gap-4 rounded-[24px] px-5 py-4"
              >
                <span className="font-semibold text-ink">{item.title}</span>
                <span className="text-[#ff3142]" aria-hidden>
                  →
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function WorkIcon({ index }: { index: number }) {
  const kind = index % 3;
  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-ink/70">
      {kind === 0 && (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path d="M7 3.5h7l4 4V20H7z" />
          <path d="M14 3.5V8h4M9 12h6M9 16h4" />
        </svg>
      )}
      {kind === 1 && (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path d="M14 4h5v5M19 4 10 13" />
          <path d="M7 7H5.5A1.5 1.5 0 0 0 4 8.5v10A1.5 1.5 0 0 0 5.5 20h10a1.5 1.5 0 0 0 1.5-1.5V15" />
        </svg>
      )}
      {kind === 2 && (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path d="M8 13.5 5 16l3 2.5" />
          <path d="M16 13.5 19 16l-3 2.5" />
          <path d="m9 16 6-1" />
          <circle cx="8" cy="8" r="2" />
          <circle cx="16" cy="8" r="2" />
        </svg>
      )}
    </span>
  );
}
