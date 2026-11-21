import Link from "next/link";
import { notFound } from "next/navigation";
import { DiscussForm } from "@/components/forms/DiscussForm";
import { InquiryChat } from "@/components/public/InquiryChat";
import { WorkIcon } from "@/components/public/WorkIcon";
import { demoServiceBySlug } from "@/lib/content/demo-catalog";
import { workIconFor, type WorkItem } from "@/lib/content/kinds";
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
  const published = await getPublishedService(slug);
  const demo = demoServiceBySlug(slug);
  const service = published ?? (demo
    ? {
        id: demo.slug,
        slug: demo.slug,
        title: demo.title,
        shortDescription: demo.shortDescription,
        fullDescription: demo.fullDescription,
        workItems: demo.workItems,
        imageId: null as string | null,
      }
    : null);
  if (!service) notFound();
  const query = await searchParams;
  const notice = query.lead === "ok" || query.lead === "error" ? query.lead : undefined;
  const channelStatus = listPublicChannelStatus();
  const items = (service.workItems || []) as WorkItem[];

  return (
    <div className="pb-28 pt-2">
      <div className="grid items-start gap-x-10 gap-y-6 lg:grid-cols-2">
        <div className="reveal order-1">
          <p className="text-sm text-ink/45">
            <Link href="/services" className="hover:text-ink">
              Услуги
            </Link>
            <span className="mx-2">›</span>
            {service.title}
          </p>
          <h1 className="mt-4 break-words font-display text-[clamp(2.05rem,7vw,3.75rem)] font-bold leading-[1.05] text-ink">
            {service.title}
          </h1>
          <div className="accent-line mt-5" />
        </div>

        <div className="order-2 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <DiscussForm
            className="reveal reveal-delay-2"
            serviceId={published?.id}
            sourcePage={`/services/${service.slug}`}
            title="Обсудить задачу"
            variant="compact"
            channelStatus={channelStatus}
            notice={notice}
            actionLabel="Обсудить задачу"
          />
        </div>

        <div className="reveal reveal-delay-3 order-3 glass-panel rounded-[28px] p-5 md:p-6">
          <h2 className="text-2xl font-bold text-ink">Чем поможем:</h2>
          <ul className="mt-4 space-y-3">
            {items.map((item, index) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <WorkIcon kind={workIconFor(item, index)} />
                <span className="min-w-0 flex-1 break-words font-medium text-ink">{item.text}</span>
                <span className="text-brand-cyan">→</span>
              </li>
            ))}
          </ul>
          {service.fullDescription ? (
            <p className="mt-4 text-sm leading-relaxed text-ink/60">{service.fullDescription}</p>
          ) : null}
        </div>
      </div>
      <InquiryChat
        topic={service.title}
        sourcePage={`/services/${service.slug}`}
        serviceId={published?.id}
        channelStatus={channelStatus}
      />
    </div>
  );
}
