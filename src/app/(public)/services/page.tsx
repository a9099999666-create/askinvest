import Link from "next/link";
import { Suspense } from "react";
import { GlassFolder } from "@/components/public/GlassFolder";
import { getServiceCards } from "@/lib/public/cache";

export const revalidate = 60;

export default function ServicesPage() {
  return (
    <div className="pt-2">
      <div className="grid items-center gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <h1 className="font-display text-5xl font-bold leading-[0.95] text-ink md:text-6xl">
            Услуги
          </h1>
          <p className="mt-3 max-w-xl text-ink/70">
            Направления поддержки бизнеса — от проверки документов до сопровождения сделки.
          </p>
        </div>
        <GlassFolder className="mx-auto max-w-sm lg:max-w-none" />
      </div>
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
  const items = await getServiceCards();
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
          <span className="shrink-0 text-xl text-[#ff3142]" aria-hidden>
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
