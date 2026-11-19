"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Lead = {
  id: string;
  stage: string;
  question: string;
  visitorName: string | null;
  visitorPhone: string | null;
  visitorEmail: string | null;
  serviceTitleSnapshot: string | null;
  propertyTitleSnapshot: string | null;
};

const stages = [
  { id: "new", title: "Вопрос" },
  { id: "in_progress", title: "Созвон" },
  { id: "done", title: "Закрыто" },
] as const;

export function LeadsBoard({ leads }: { leads: Lead[] }) {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const visible = useMemo(() => {
    if (!query) return leads;
    return leads.filter((lead) =>
      [
        lead.question,
        lead.visitorName,
        lead.visitorPhone,
        lead.visitorEmail,
        lead.serviceTitleSnapshot,
        lead.propertyTitleSnapshot,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [leads, query]);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-ink">Заявки</h1>
      <label className="relative mt-5 block max-w-xl">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          ⌕
        </span>
        <input
          className="field pl-10"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Поиск по услуге, вопросу или контакту"
        />
      </label>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {stages.map((stage) => {
          const items = visible.filter((lead) => lead.stage === stage.id);
          return (
            <div key={stage.id} className="rounded-[28px] bg-white/80 p-4 shadow-panel">
              <h2 className="font-semibold text-ink">
                {stage.title}
                <span className="ml-2 text-sm font-medium text-ink/40">{items.length}</span>
              </h2>
              <ul className="mt-3 space-y-2">
                {items.map((lead) => (
                  <li key={lead.id}>
                    <Link
                      href={`/admin/leads/${lead.id}`}
                      className="block rounded-xl border border-slate-100 bg-white p-3 hover:border-brand-blue"
                    >
                      <div className="text-sm font-semibold line-clamp-2">
                        {lead.serviceTitleSnapshot ||
                          lead.propertyTitleSnapshot ||
                          lead.visitorName ||
                          lead.question}
                      </div>
                      <div className="mt-1 text-xs text-ink/60">
                        {lead.question.slice(0, 80)}
                        {lead.visitorPhone || lead.visitorEmail
                          ? ` · ${lead.visitorPhone || lead.visitorEmail}`
                          : ""}
                      </div>
                    </Link>
                  </li>
                ))}
                {items.length === 0 && (
                  <li className="px-1 py-6 text-sm text-ink/45">Пока пусто.</li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
