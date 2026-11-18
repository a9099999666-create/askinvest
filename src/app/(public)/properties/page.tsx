import Link from "next/link";
import { Suspense } from "react";
import { InteriorShot } from "@/components/public/InteriorShot";
import { getPropertyCards } from "@/lib/public/cache";

export const revalidate = 60;

export default function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <div className="pt-2">
      <link rel="preload" href="/brand/catalog-glass.webp" as="image" type="image/webp" />
      <div className="grid items-center gap-2 md:grid-cols-[1fr_320px]">
        <h1 className="font-display text-5xl font-bold leading-[0.95] text-ink md:text-6xl">
          Коммерческая
          <br />
          недвижимость
        </h1>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/catalog-glass.webp"
          alt=""
          width={800}
          height={250}
          className="w-full max-w-md select-none justify-self-end"
        />
      </div>
      <Suspense
        fallback={
          <>
            <div className="glass-panel mt-6 h-40 rounded-[28px]" />
            <div className="mt-8 h-56 rounded-[24px] bg-white/50" />
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

  const items = await getPropertyCards(deal, q, area);

  return (
    <>
      <form className="glass-panel mt-6 rounded-[28px] p-4 md:p-5" action="/properties" method="get">
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
              className={`rounded-2xl px-4 py-2 text-sm font-semibold ${
                deal === value ? "bg-sky-100 text-sky-700" : "bg-white text-ink"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_220px_auto]">
          <label className="relative block">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">⌕</span>
            <input className="field pl-10" name="q" defaultValue={q} placeholder="Поиск по адресу" />
          </label>
          <select className="field" name="area" defaultValue={area} aria-label="Площадь, м²">
            <option value="">Площадь, м²</option>
            <option value="100">до 100 м²</option>
            <option value="300">100–300 м²</option>
            <option value="1000">300–1 000 м²</option>
            <option value="1000p">от 1 000 м²</option>
          </select>
          {deal !== "all" && <input type="hidden" name="deal" value={deal} />}
          <button className="btn-primary justify-between px-5" type="submit">
            <span>Показать объекты</span>
            <span aria-hidden>→</span>
          </button>
        </div>
      </form>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/properties/${item.slug}`}
            prefetch={false}
            className="overflow-hidden rounded-[24px] bg-white shadow-panel transition hover:-translate-y-0.5"
          >
            <div className="relative h-44 bg-slate-100">
              {item.coverId ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/media/${item.coverId}`}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <InteriorShot seed={item.address} className="h-full w-full" />
              )}
              <span
                className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  item.dealType === "sale"
                    ? "bg-rose-50 text-rose-600"
                    : "bg-sky-50 text-sky-700"
                }`}
              >
                {item.dealType === "sale" ? "Продажа" : "Аренда"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 px-4 py-4">
              <div className="font-semibold text-ink">{item.address}</div>
              <span className="text-[#ff3142]">→</span>
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
