import Link from "next/link";
import { Suspense } from "react";
import { getServiceCards } from "@/lib/public/cache";

export const revalidate = 60;

export default function ServicesPage() {
  return (
    <div className="pt-4">
      <h1 className="font-display text-4xl font-bold text-ink">Услуги</h1>
      <p className="mt-2 text-ink/70">Направления поддержки бизнеса</p>
      <Suspense
        fallback={
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-36 rounded-2xl bg-white/70" />
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
    <div className="mt-8 grid gap-4 md:grid-cols-2">
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/services/${item.slug}`}
          className="glass-panel rounded-2xl p-6 transition hover:-translate-y-0.5"
        >
          <h2 className="text-xl font-bold text-ink">{item.title}</h2>
          <p className="mt-2 text-ink/70">{item.shortDescription}</p>
          <span className="mt-4 inline-block text-brand-red">Подробнее →</span>
        </Link>
      ))}
      {items.length === 0 && (
        <p className="text-ink/60">Пока нет опубликованных услуг.</p>
      )}
    </div>
  );
}
