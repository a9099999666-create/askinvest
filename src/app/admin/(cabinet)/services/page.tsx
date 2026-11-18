import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { services, serviceVersions } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  const rows = await db.select().from(services).orderBy(desc(services.updatedAt));
  const versions = await db.select().from(serviceVersions);
  const byService = new Map<string, typeof versions>();
  for (const v of versions) {
    const list = byService.get(v.serviceId) || [];
    list.push(v);
    byService.set(v.serviceId, list);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold text-ink">Услуги</h1>
        <Link href="/admin/services/new" className="btn-primary">
          + Добавить услугу
        </Link>
      </div>
      <div className="mt-4 overflow-hidden rounded-2xl bg-white/80">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-ink/60">
            <tr>
              <th className="px-4 py-3">Услуга</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => {
              const list = (byService.get(s.id) || []).sort(
                (a, b) => b.version - a.version,
              );
              const editable =
                list.find((v) => v.status === "draft" || v.status === "review") ||
                list.find((v) => v.id === s.publishedVersionId) ||
                list[0];
              return (
                <tr key={s.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <div className="font-semibold">{editable?.title || s.slug}</div>
                    <div className="text-ink/60">{editable?.shortDescription}</div>
                  </td>
                  <td className="px-4 py-3">{editable?.status || "draft"}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/services/${s.id}`} className="text-brand-blue">
                      Изменить
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
