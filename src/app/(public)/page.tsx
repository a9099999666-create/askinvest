import Link from "next/link";
import { eq, asc } from "drizzle-orm";
import { db } from "@/db/client";
import { services, serviceVersions } from "@/db/schema";
import { CrystalHero } from "@/components/public/CrystalHero";
import { DiscussForm } from "@/components/forms/DiscussForm";

export const dynamic = "force-dynamic";

async function getPublishedServices() {
  const rows = await db
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
  return rows;
}

export default async function HomePage() {
  const items = await getPublishedServices();

  return (
    <div>
      <section className="grid items-center gap-8 pt-4 md:grid-cols-2 md:gap-10 md:pt-8">
        <div className="animate-rise">
          <h1 className="font-display text-4xl font-bold leading-tight text-ink md:text-5xl lg:text-6xl">
            Услуги для бизнеса
          </h1>
          <p className="mt-4 max-w-md text-base text-ink/70 md:text-lg">
            Сопровождение сделок, юридическая поддержка и коммерческая
            недвижимость в одном кабинете АСКИНВЕСТ.
          </p>
          <CrystalHero className="mt-6 md:mt-10" />
        </div>
        <DiscussForm sourcePage="/" />
      </section>

      <section className="mt-14">
        <h2 className="sr-only">Направления услуг</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {items.length === 0 && (
            <p className="text-ink/60">
              Опубликованные услуги появятся здесь после загрузки владельцем.
            </p>
          )}
          {items.map((s, i) => (
            <Link
              key={s.id}
              href={`/services/${s.slug}`}
              className="glass-panel group flex items-center justify-between rounded-2xl px-5 py-4 transition hover:-translate-y-0.5"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div>
                <div className="font-semibold text-ink">{s.title}</div>
                <div className="mt-1 text-sm text-ink/60 line-clamp-2">
                  {s.shortDescription}
                </div>
              </div>
              <span className="text-brand-red transition group-hover:translate-x-1">
                →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
