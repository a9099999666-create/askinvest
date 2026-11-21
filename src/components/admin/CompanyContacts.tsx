"use client";

import { useState, useTransition } from "react";

export function CompanyContacts({
  initial,
}: {
  initial: {
    contactPhone: string;
    contactAddress: string;
    contactHours: string;
    contactsHtml: string;
  };
}) {
  const [form, setForm] = useState(initial);
  const [saved, setSaved] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  function save() {
    setError("");
    setSaved("");
    start(async () => {
      const res = await fetch("/api/admin/site-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Не сохранилось");
        return;
      }
      setSaved("Сохранено");
    });
  }

  return (
    <section className="mt-8 rounded-[28px] bg-white p-5 shadow-panel">
      <h2 className="font-display text-2xl font-bold text-ink">Контакты на сайте</h2>
      <p className="mt-1 text-sm text-ink/55">Телефон, адрес и часы видны на странице «Контакты».</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm text-ink/70">Телефон</span>
          <input
            className="field"
            value={form.contactPhone}
            onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
            placeholder="+7 495 000-00-00"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-ink/70">Часы работы</span>
          <input
            className="field"
            value={form.contactHours}
            onChange={(e) => setForm({ ...form, contactHours: e.target.value })}
            placeholder="Пн–Пт 10:00–19:00 по Москве"
          />
        </label>
      </div>
      <label className="mt-3 block">
        <span className="mb-1 block text-sm text-ink/70">Адрес</span>
        <input
          className="field"
          value={form.contactAddress}
          onChange={(e) => setForm({ ...form, contactAddress: e.target.value })}
          placeholder="Москва"
        />
      </label>
      <label className="mt-3 block">
        <span className="mb-1 block text-sm text-ink/70">Дополнительный текст</span>
        <textarea
          className="field min-h-24"
          value={form.contactsHtml}
          onChange={(e) => setForm({ ...form, contactsHtml: e.target.value })}
        />
      </label>
      {error ? <p className="mt-2 text-sm text-brand-red">{error}</p> : null}
      {saved ? <p className="mt-2 text-sm text-emerald-700">{saved}</p> : null}
      <button className="btn-primary mt-4" type="button" disabled={pending} onClick={save}>
        Сохранить контакты
      </button>
    </section>
  );
}
