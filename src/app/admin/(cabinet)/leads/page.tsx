import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { leads } from "@/db/schema";
import { requirePageAccess } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

const stages = [
  { id: "new", title: "Новые" },
  { id: "in_progress", title: "В работе" },
  { id: "done", title: "Завершены" },
] as const;

export default async function LeadsPage() {
  await requirePageAccess("leads");
  const all = await db.select().from(leads).orderBy(desc(leads.createdAt));

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-ink">Заявки</h1>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {stages.map((stage) => (
          <div key={stage.id} className="rounded-2xl bg-white/80 p-4">
            <h2 className="font-semibold text-ink">{stage.title}</h2>
            <ul className="mt-3 space-y-2">
              {all
                .filter((l) => l.stage === stage.id)
                .map((l) => (
                  <li key={l.id}>
                    <Link
                      href={`/admin/leads/${l.id}`}
                      className="block rounded-xl border border-slate-100 bg-white p-3 hover:border-brand-blue"
                    >
                      <div className="text-sm font-semibold line-clamp-2">
                        {l.visitorName || l.question}
                      </div>
                      <div className="mt-1 text-xs text-ink/60">
                        {l.visitorPhone || l.visitorEmail || l.channel} · {l.question.slice(0, 80)}
                        {l.serviceTitleSnapshot
                          ? ` · ${l.serviceTitleSnapshot}`
                          : ""}
                        {l.propertyTitleSnapshot
                          ? ` · ${l.propertyTitleSnapshot}`
                          : ""}
                      </div>
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
