import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { services, serviceVersions } from "@/db/schema";
import { DiscussForm } from "@/components/forms/DiscussForm";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const items = await db
    .select({
      id: services.id,
      slug: services.slug,
      title: serviceVersions.title,
    })
    .from(services)
    .innerJoin(serviceVersions, eq(services.publishedVersionId, serviceVersions.id))
    .orderBy(asc(services.sortOrder));

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
            src="/brand/home-glass.png"
            alt=""
            className="mt-1 w-full max-w-[640px] select-none"
          />
        </div>
        <DiscussForm sourcePage="/" />
      </section>

      <section className="mt-2">
        <h2 className="sr-only">Направления услуг</h2>
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
      </section>
    </div>
  );
}
