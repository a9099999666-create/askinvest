import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { services, serviceVersions } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const items = await db
    .select({
      id: services.id,
      slug: services.slug,
      title: serviceVersions.title,
      shortDescription: serviceVersions.shortDescription,
    })
    .from(services)
    .innerJoin(
      serviceVersions,
      eq(services.publishedVersionId, serviceVersions.id),
    )
    .orderBy(asc(services.sortOrder));

  return (
    <div className="pt-4">
      <h1 className="font-display text-4xl font-bold text-ink">Услуги</h1>
      <p className="mt-2 text-ink/70">Направления поддержки бизнеса</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {items.map((s) => (
          <Link
            key={s.id}
            href={`/services/${s.slug}`}
            className="glass-panel rounded-2xl p-6 transition hover:-translate-y-0.5"
          >
            <h2 className="text-xl font-bold text-ink">{s.title}</h2>
            <p className="mt-2 text-ink/70">{s.shortDescription}</p>
            <span className="mt-4 inline-block text-brand-red">Подробнее →</span>
          </Link>
        ))}
        {items.length === 0 && (
          <p className="text-ink/60">Пока нет опубликованных услуг.</p>
        )}
      </div>
    </div>
  );
}
