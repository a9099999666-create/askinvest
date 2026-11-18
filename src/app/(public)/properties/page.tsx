import Link from "next/link";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { properties, propertyVersions } from "@/db/schema";
import { CrystalHero } from "@/components/public/CrystalHero";
import { formatArea, formatRub } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const deal = sp.deal || "all";
  const q = sp.q || "";
  const areaMin = sp.areaMin;
  const areaMax = sp.areaMax;

  const conditions = [eq(propertyVersions.status, "published")];
  if (deal === "sale" || deal === "rent") {
    conditions.push(eq(propertyVersions.dealType, deal));
  }
  if (q) {
    conditions.push(
      sql`${propertyVersions.address} ilike ${"%" + q + "%"}`,
    );
  }
  if (areaMin) conditions.push(gte(propertyVersions.areaSqm, areaMin));
  if (areaMax) conditions.push(lte(propertyVersions.areaSqm, areaMax));

  const items = await db
    .select({
      id: properties.id,
      slug: properties.slug,
      title: propertyVersions.title,
      address: propertyVersions.address,
      dealType: propertyVersions.dealType,
      areaSqm: propertyVersions.areaSqm,
      priceRub: propertyVersions.priceRub,
      priceUnit: propertyVersions.priceUnit,
    })
    .from(properties)
    .innerJoin(
      propertyVersions,
      eq(properties.publishedVersionId, propertyVersions.id),
    )
    .where(and(...conditions));

  function hrefFor(next: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged = { deal, q, areaMin, areaMax, ...next };
    Object.entries(merged).forEach(([k, v]) => {
      if (v && v !== "all") params.set(k, v);
    });
    const s = params.toString();
    return s ? `/properties?${s}` : "/properties";
  }

  return (
    <div className="pt-2">
      <div className="grid items-center gap-4 md:grid-cols-[1fr_280px]">
        <h1 className="font-display text-4xl font-bold leading-tight text-ink md:text-6xl">
          Коммерческая
          <br />
          недвижимость
        </h1>
        <CrystalHero className="md:-mr-6" />
      </div>

      <form
        className="glass-panel mt-8 rounded-3xl p-5"
        action="/properties"
        method="get"
      >
        <div className="flex flex-wrap gap-2">
          {[
            ["all", "Все объекты"],
            ["sale", "Продажа"],
            ["rent", "Аренда"],
          ].map(([value, label]) => (
            <Link
              key={value}
              href={hrefFor({ deal: value })}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                deal === value
                  ? "bg-sky-100 text-brand-blue"
                  : "bg-white/70 text-ink"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_140px_140px_auto]">
          <input
            className="field"
            name="q"
            defaultValue={q}
            placeholder="Поиск по адресу"
          />
          <input
            className="field"
            name="areaMin"
            defaultValue={areaMin || ""}
            placeholder="от м²"
            inputMode="decimal"
          />
          <input
            className="field"
            name="areaMax"
            defaultValue={areaMax || ""}
            placeholder="до м²"
            inputMode="decimal"
          />
          <input type="hidden" name="deal" value={deal} />
          <button className="btn-primary" type="submit">
            Показать объекты →
          </button>
        </div>
        <Link href="/properties" className="mt-3 inline-block text-sm text-brand-blue">
          Сбросить фильтры
        </Link>
      </form>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {items.map((p) => (
          <Link
            key={p.id}
            href={`/properties/${p.slug}`}
            className="glass-panel overflow-hidden rounded-2xl transition hover:-translate-y-0.5"
          >
            <div className="relative flex h-40 items-end bg-gradient-to-br from-sky-200 to-slate-200 p-3">
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold text-white ${
                  p.dealType === "sale" ? "bg-brand-red" : "bg-brand-blue"
                }`}
              >
                {p.dealType === "sale" ? "Продажа" : "Аренда"}
              </span>
            </div>
            <div className="flex items-center justify-between p-4">
              <div>
                <div className="font-semibold text-ink">{p.address}</div>
                <div className="mt-1 text-sm text-ink/60">
                  {formatArea(p.areaSqm)} · {formatRub(p.priceRub, p.priceUnit)}
                </div>
              </div>
              <span className="text-brand-red">→</span>
            </div>
          </Link>
        ))}
        {items.length === 0 && (
          <p className="text-ink/60">Нет объектов по выбранным фильтрам.</p>
        )}
      </div>
    </div>
  );
}
