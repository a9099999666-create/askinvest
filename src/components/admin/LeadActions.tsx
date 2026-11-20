"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { leadStages } from "@/lib/crm/stages";

export function LeadActions({
  leadId,
  stage,
  note,
  nextAction,
}: {
  leadId: string;
  stage: string;
  note: string;
  nextAction: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState({ note, nextAction, stage });
  const [pending, start] = useTransition();

  function save() {
    start(async () => {
      await fetch(`/api/admin/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      router.refresh();
    });
  }

  return (
    <div className="mt-4 space-y-3 rounded-2xl bg-white/80 p-5">
      <label className="block">
        <span className="mb-1 block text-sm">Стадия</span>
        <select
          className="field"
          value={form.stage}
          onChange={(e) => setForm({ ...form, stage: e.target.value })}
        >
          {leadStages.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-sm">Заметка</span>
        <textarea
          className="field"
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm">Следующее действие</span>
        <input
          className="field"
          value={form.nextAction}
          onChange={(e) => setForm({ ...form, nextAction: e.target.value })}
        />
      </label>
      <button className="btn-primary" disabled={pending} onClick={save}>
        Сохранить
      </button>
    </div>
  );
}
