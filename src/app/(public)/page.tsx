import Link from "next/link";
import { Suspense } from "react";
import { DiscussForm } from "@/components/forms/DiscussForm";
import { getHomeServices } from "@/lib/public/cache";

export const revalidate = 60;

export default function HomePage() {
  return (
    <div>
      <section className="grid items-start gap-4 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
        <div>
          <h1 className="font-display text-5xl font-bold leading-[0.95] tracking-tight text-ink md:text-6xl lg:text-[68px]">
            Услуги
            <br />
            для бизнеса
          </h1>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/home-glass.webp"
            alt=""
            width={660}
            height={490}
            fetchPriority="high"
            className="mt-1 h-auto w-full max-w-[640px] select-none"
          />
        </div>
        <DiscussForm sourcePage="/" />
      </section>

      <section className="mt-2">
        <h2 className="sr-only">Направления услуг</h2>
        <Suspense fallback={<CardSkeleton />}>
          <HomeServices />
        </Suspense>
      </section>
    </div>
  );
}

async function HomeServices() {
  const items = await getHomeServices();
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.length === 0 && (
        <p className="text-ink/60">Опубликованные услуги появятся здесь.</p>
      )}
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/services/${item.slug}`}
          className="glass-panel flex min-h-[88px] items-center justify-between gap-4 rounded-[24px] px-6 py-5"
        >
          <span className="text-lg font-semibold leading-snug text-ink">{item.title}</span>
          <span className="text-xl text-[#ff3142]" aria-hidden>
            →
          </span>
        </Link>
      ))}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {[0, 1, 2].map((item) => (
        <div key={item} className="h-[88px] rounded-[24px] bg-white/70" />
      ))}
    </div>
  );
}
