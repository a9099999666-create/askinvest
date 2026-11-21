import Link from "next/link";
import { Suspense } from "react";
import { DEMO_SERVICES } from "@/lib/content/demo-catalog";
import { getServiceCards } from "@/lib/public/cache";

export const revalidate = 60;

export default function ServicesPage() {
  return (
    <div className="pt-2">
      <h1 className="font-display text-5xl font-semibold leading-[0.95] text-ink md:text-6xl">
        Услуги
      </h1>
      <div className="accent-line mt-5" />
      <p className="mt-4 max-w-xl text-ink/70">
        Направления поддержки бизнеса — от проверки документов до сопровождения сделки.
      </p>
      <Suspense
        fallback={
          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-24 rounded-[24px] bg-white/70" />
            ))}
          </div>
        }
      >
        <ServiceList />
      </Suspense>
    </div>
  );
}

async function ServiceList() {
  const published = await getServiceCards();
  const items =
    published.length > 0
      ? published
      : DEMO_SERVICES.map((item) => ({
          id: item.slug,
          slug: item.slug,
          title: item.title,
          shortDescription: item.shortDescription,
          imageId: null as string | null,
        }));
  return (
    <div className="mt-8 grid gap-3 md:grid-cols-2">
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/services/${item.slug}`}
          prefetch={false}
          className="glass-panel flex min-h-[96px] items-center justify-between gap-4 rounded-[24px] px-5 py-4 transition hover:-translate-y-0.5 md:px-6"
        >
          <span className="min-w-0">
            <span className="block text-[17px] font-semibold leading-snug text-ink md:text-lg">
              {item.title}
            </span>
            {item.shortDescription ? (
              <span className="mt-1 block text-sm text-ink/55">{item.shortDescription}</span>
            ) : null}
          </span>
          <span className="shrink-0 text-xl text-brand-cyan" aria-hidden>
            →
          </span>
        </Link>
      ))}
      {items.length === 0 && (
        <p className="text-ink/60">Пока нет опубликованных услуг.</p>
      )}
    </div>
  );
}
