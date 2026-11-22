"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { leadStages } from "@/lib/crm/stages";
import { PageTitle } from "./PageTitle";

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

const stages = leadStages;

const stageTone: Record<string, string> = {
  new: "from-brand-cyan to-sky-400",
  in_progress: "from-amber-400 to-orange-400",
  done: "from-emerald-400 to-teal-400",
};

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
      <PageTitle title="Заявки" subtitle="Вопросы с сайта, готовые к ответу в кабинете." />
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
            <div key={stage.id} className="cabinet-card p-4">
              <h2 className="flex items-center gap-2 font-semibold text-ink">
                <span
                  className={`h-2.5 w-2.5 rounded-full bg-gradient-to-r ${stageTone[stage.id] || "from-slate-300 to-slate-400"}`}
                />
                {stage.title}
                <span className="ml-auto text-sm font-medium text-ink/40">{items.length}</span>
              </h2>
              <ul className="mt-3 space-y-2">
                {items.map((lead) => (
                  <li key={lead.id}>
                    <Link
                      href={`/cabinet/leads/${lead.id}`}
                      className="block rounded-2xl border border-slate-100 bg-slate-50/70 p-3 transition hover:border-brand-cyan/40 hover:bg-white"
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
                  <li className="px-1 py-8 text-center text-sm text-ink/40">Пока пусто.</li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
