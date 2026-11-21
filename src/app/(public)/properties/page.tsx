import Link from "next/link";
import { Suspense } from "react";
import { filterDemoProperties } from "@/lib/content/demo-catalog";
import { getPropertyCards } from "@/lib/public/cache";

export const revalidate = 60;

export default function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <div className="pt-2">
      <h1 className="reveal font-display text-5xl font-semibold leading-[0.95] text-ink md:text-6xl">
        Коммерческая
        <br />
        недвижимость
      </h1>
      <Suspense
        fallback={
          <>
            <div className="glass-panel mt-6 h-40 rounded-[28px]" />
            <div className="mt-8 h-24 rounded-[24px] bg-white/50" />
          </>
        }
      >
        <Catalog searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Catalog({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const deal = sp.deal || "all";
  const q = sp.q || "";
  const area = sp.area || "";

  function hrefFor(nextDeal: string) {
    const params = new URLSearchParams();
    if (nextDeal !== "all") params.set("deal", nextDeal);
    if (q) params.set("q", q);
    if (area) params.set("area", area);
    const query = params.toString();
    return query ? `/properties?${query}` : "/properties";
  }

  const catalog = await getPropertyCards("all", "", "");
  const items =
    catalog.length > 0
      ? await getPropertyCards(deal, q, area)
      : filterDemoProperties(deal, q, area).map((item) => ({
          id: item.slug,
          slug: item.slug,
          address: item.address,
          dealType: item.dealType,
          placeKind: item.placeKind,
          coverId: null as string | null,
        }));

  return (
    <>
      <form className="reveal reveal-delay-2 glass-panel mt-6 flex flex-col gap-4 rounded-[28px] p-4 md:p-5" action="/properties" method="get">
        <div className="flex flex-wrap gap-2">
          {[
            ["all", "Все объекты"],
            ["sale", "Продажа"],
            ["rent", "Аренда"],
          ].map(([value, label]) => (
            <Link
              key={value}
              href={hrefFor(value)}
              prefetch={false}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition duration-200 ${
                deal === value
                  ? "bg-brand-blue text-white"
                  : "border border-white/40 bg-white/20 text-ink hover:bg-white/30"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
          <label className="relative block">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden>
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none">
                <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.6" />
                <path d="m13.2 13.2 3.3 3.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </span>
            <input className="field pl-10" name="q" defaultValue={q} placeholder="Поиск по адресу" />
          </label>
          <select className="field" name="area" defaultValue={area} aria-label="Площадь, м²">
            <option value="">Площадь, м²</option>
            <option value="100">до 100 м²</option>
            <option value="300">100–300 м²</option>
            <option value="1000">300–1 000 м²</option>
            <option value="1000p">от 1 000 м²</option>
          </select>
          <button className="btn-primary !justify-between px-5" type="submit">
            <span>Показать объекты</span>
            <span aria-hidden>→</span>
          </button>
        </div>
        {deal !== "all" ? <input type="hidden" name="deal" value={deal} /> : null}
      </form>

      <div className="stagger-in mt-8 grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/properties/${item.slug}`}
            prefetch={false}
            className="glass-panel rounded-[28px] px-5 py-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-panel"
          >
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                item.dealType === "sale"
                  ? "bg-brand-red/20 text-brand-red"
                  : "bg-brand-cyan/20 text-brand-cyan"
              }`}
            >
              {item.dealType === "sale" ? "Продажа" : "Аренда"}
            </span>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="font-semibold text-ink">{item.address}</div>
              <span className="text-brand-cyan">→</span>
            </div>
          </Link>
        ))}
        {items.length === 0 && (
          <p className="text-ink/60">Нет объектов по выбранным фильтрам.</p>
        )}
      </div>
    </>
  );
}
