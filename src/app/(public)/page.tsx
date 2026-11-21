import Link from "next/link";
import { Suspense } from "react";
import { DiscussForm } from "@/components/forms/DiscussForm";
import { isPublicServiceTitle } from "@/lib/content/kinds";
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
      <section className="grid items-start gap-8 lg:grid-cols-2 lg:gap-x-12">
        <h1 className="font-display text-[40px] font-semibold leading-[1.08] tracking-tight text-ink md:text-[48px] lg:text-[52px]">
          Услуги
          <br />
          для бизнеса
        </h1>
        <DiscussForm
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
          className="glass-panel flex min-h-[84px] items-center justify-between gap-4 rounded-[24px] px-5 py-5 md:min-h-[92px] md:px-6"
        >
          <span className="text-[17px] font-semibold leading-snug text-ink md:text-lg">
            {item.title}
          </span>
          <span className="shrink-0 text-xl text-brand-red" aria-hidden>
            →
          </span>
        </Link>
      ))}
      <Link
        href="/services"
        prefetch={false}
        className="glass-panel flex min-h-[84px] items-center justify-between gap-4 rounded-[24px] px-5 py-5 md:min-h-[92px] md:px-6"
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
        <div key={item} className="h-[76px] rounded-[24px] bg-white/70" />
      ))}
    </div>
  );
}
