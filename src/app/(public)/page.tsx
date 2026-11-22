import Link from "next/link";
import { Suspense } from "react";
import { DiscussForm } from "@/components/forms/DiscussForm";
import { DEMO_SERVICES } from "@/lib/content/demo-catalog";
import { isPublicServiceTitle } from "@/lib/content/kinds";
import { listPublicChannelStatus } from "@/lib/channels";
import { getHomeServices } from "@/lib/public/cache";

export const revalidate = 60;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ lead?: string }>;
}) {
  const channelStatus = listPublicChannelStatus();
  const params = await searchParams;
  const notice = params.lead === "ok" || params.lead === "error" ? params.lead : undefined;

  return (
    <div>
      <section className="grid items-end gap-6 pb-2 pt-4 sm:gap-8 sm:pt-8 lg:min-h-[74vh] lg:grid-cols-2 lg:items-center lg:gap-x-12">
        <div className="reveal max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/45">
            АСКИНВЕСТ
          </p>
          <h1 className="mt-3 font-display text-[clamp(2.35rem,8vw,4.5rem)] font-semibold leading-[0.98] tracking-tight text-ink">
            Услуги
            <br />
            для бизнеса
          </h1>
          <div className="accent-line mt-5" />
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/65 md:text-base">
            Сначала думаем. Потом вокруг решения вырастает город — от мысли к камню.
          </p>
        </div>
        <DiscussForm
          className="reveal reveal-delay-2"
          sourcePage="/"
          variant="compact"
          channelStatus={channelStatus}
          notice={notice}
          actionLabel="Обсудить задачу"
        />
      </section>

      <section className="mt-8">
        <h2 className="sr-only">Направления услуг</h2>
        <Suspense fallback={<CardSkeleton />}>
          <HomeServices />
        </Suspense>
      </section>
    </div>
  );
}

async function HomeServices() {
  const published = (await getHomeServices()).filter((item) =>
    isPublicServiceTitle(item.title),
  );
  const items =
    published.length > 0
      ? published.slice(0, 2)
      : DEMO_SERVICES.slice(0, 2).map((item) => ({
          id: item.slug,
          slug: item.slug,
          title: item.title,
        }));

  return (
    <div className="stagger-in grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/services/${item.slug}`}
          prefetch={false}
          className="glass-panel flex min-h-[84px] items-center justify-between gap-4 rounded-[24px] px-5 py-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-panel md:min-h-[92px] md:px-6"
        >
          <span className="text-[17px] font-semibold leading-snug text-ink md:text-lg">
            {item.title}
          </span>
          <span className="shrink-0 text-xl text-brand-cyan" aria-hidden>
            →
          </span>
        </Link>
      ))}
      <Link
        href="/services"
        prefetch={false}
        className="glass-panel flex min-h-[84px] items-center justify-between gap-4 rounded-[24px] px-5 py-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-panel md:min-h-[92px] md:px-6"
      >
        <span className="text-[17px] font-semibold leading-snug text-ink md:text-lg">
          Другие услуги
        </span>
          <span className="shrink-0 text-xl text-brand-red" aria-hidden>
          →
        </span>
      </Link>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((item) => (
        <div key={item} className="h-[76px] rounded-[24px] bg-white/5" />
      ))}
    </div>
  );
}
