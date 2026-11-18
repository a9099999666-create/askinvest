import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { properties, propertyVersions } from "@/db/schema";
import { formatArea } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminPropertiesPage() {
  const props = await db.select().from(properties).orderBy(desc(properties.updatedAt));
  const versions = await db.select().from(propertyVersions);

  const byProperty = new Map<string, typeof versions>();
  for (const v of versions) {
    const list = byProperty.get(v.propertyId) || [];
    list.push(v);
    byProperty.set(v.propertyId, list);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl font-bold text-ink">
            Управление сайтом
          </h1>
          <div className="mt-2 h-[3px] w-12 rounded bg-brand-red" />
        </div>
        <div className="flex gap-2">
          <Link href="/admin/properties/new" className="btn-primary">
            + Добавить объект
          </Link>
          <Link href="/admin/services/new" className="btn-primary">
            + Добавить услугу
          </Link>
        </div>
      </div>
      <div className="mt-4 flex gap-4 border-b border-slate-200 text-sm font-semibold">
        <span className="border-b-2 border-brand-red px-1 pb-2 text-ink">
          Объекты
        </span>
        <Link href="/admin/services" className="px-1 pb-2 text-ink/50">
          Услуги
        </Link>
      </div>
      <div className="mt-4 overflow-hidden rounded-2xl bg-white/80">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-ink/60">
            <tr>
              <th className="px-4 py-3">Материал</th>
              <th className="px-4 py-3">Тип</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {props.map((p) => {
              const list = (byProperty.get(p.id) || []).sort(
                (a, b) => b.version - a.version,
              );
              const editable =
                list.find((v) => v.status === "draft" || v.status === "review") ||
                list.find((v) => v.id === p.publishedVersionId) ||
                list[0];
              const status = editable?.status || "draft";
              return (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-ink">
                      {editable?.title || p.slug}
                    </div>
                    <div className="text-ink/60">
                      {editable?.address}
                      {editable ? ` · ${formatArea(editable.areaSqm)}` : ""}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="status-pill bg-slate-100">Помещение</span>
                  </td>
                  <td className="px-4 py-3">
                    <Status status={status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/properties/${p.id}`}
                      className="text-brand-blue"
                    >
                      Изменить
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {props.length === 0 && (
          <p className="p-6 text-ink/60">Объектов пока нет.</p>
        )}
      </div>
    </div>
  );
}

function Status({ status }: { status: string }) {
  const map: Record<string, string> = {
    published: "bg-emerald-100 text-emerald-800",
    draft: "bg-slate-100 text-slate-700",
    review: "bg-amber-100 text-amber-800",
    archived: "bg-slate-200 text-slate-600",
  };
  const labels: Record<string, string> = {
    published: "Опубликовано",
    draft: "Черновик",
    review: "На проверке",
    archived: "Архив",
  };
  return (
    <span className={`status-pill ${map[status] || map.draft}`}>
      {labels[status] || status}
    </span>
  );
}
