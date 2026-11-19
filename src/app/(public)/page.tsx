import Link from "next/link";
import { Suspense } from "react";
import { DiscussForm } from "@/components/forms/DiscussForm";
import { listPublicChannelStatus } from "@/lib/channels";
import { getHomeServices } from "@/lib/public/cache";

export const revalidate = 60;

const demoHomeServices = [
  {
    id: "demo-legal",
    slug: "yuridicheskoe-soprovozhdenie",
    title: "Юридическое сопровождение",
  },
  {
    id: "demo-deals",
    slug: "soprovozhdenie-sdelok",
    title: "Сопровождение сделок",
  },
];

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
      <link rel="preload" href="/brand/home-glass.webp" as="image" type="image/webp" />
      <section className="grid items-start gap-3 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:grid-rows-[auto_1fr] lg:gap-x-10 lg:gap-y-3">
        <h1 className="order-1 font-display text-[40px] font-semibold leading-[1.08] tracking-tight text-ink md:text-[48px] lg:col-start-1 lg:row-start-1 lg:text-[52px]">
          Услуги
          <br />
          для бизнеса
        </h1>
        <div className="order-2 lg:order-3 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <DiscussForm
            sourcePage="/"
            variant="compact"
            channelStatus={channelStatus}
            notice={notice}
          />
        </div>
        <div className="order-3 min-w-0 lg:order-2 lg:col-start-1 lg:row-start-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/home-glass.webp"
            alt=""
            width={980}
            height={720}
            fetchPriority="high"
            className="hero-glass mt-1 h-auto w-full max-h-[120px] max-w-[420px] object-contain object-left select-none sm:max-h-[180px] sm:max-w-[560px] lg:mt-0 lg:max-h-[384px] lg:max-w-[660px]"
          />
        </div>
      </section>

      <section className="relative z-10 mt-6 lg:mt-8">
        <h2 className="sr-only">Направления услуг</h2>
        <Suspense fallback={<CardSkeleton />}>
          <HomeServices />
        </Suspense>
      </section>
    </div>
  );
}

async function HomeServices() {
  const published = await getHomeServices();
  const items =
    published.length > 0
      ? published.slice(0, 2)
      : process.env.VERCEL_ENV === "production"
        ? []
        : demoHomeServices;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/services/${item.slug}`}
          prefetch={false}
          className="glass-panel flex min-h-[76px] items-center justify-between gap-4 rounded-[24px] px-5 py-4 md:min-h-[84px] md:px-6"
        >
          <span className="text-[17px] font-semibold leading-snug text-ink md:text-lg">
            {item.title}
          </span>
          <span className="shrink-0 text-xl text-[#ff3142]" aria-hidden>
            →
          </span>
        </Link>
      ))}
      <Link
        href="/services"
        prefetch={false}
        className="glass-panel flex min-h-[76px] items-center justify-between gap-4 rounded-[24px] px-5 py-4 md:min-h-[84px] md:px-6"
      >
        <span className="text-[17px] font-semibold leading-snug text-ink md:text-lg">
          Все услуги
        </span>
        <span className="shrink-0 text-xl text-[#ff3142]" aria-hidden>
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
        <div key={item} className="h-[76px] rounded-[24px] bg-white/70" />
      ))}
    </div>
  );
}
