"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Option = { id: string; title: string };

export function HomeFeatured({
  options,
  initialIds,
}: {
  options: Option[];
  initialIds: string[];
}) {
  const router = useRouter();
  const [slot1, setSlot1] = useState(initialIds[0] || "");
  const [slot2, setSlot2] = useState(initialIds[1] || "");
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();

  function save() {
    setMessage("");
    start(async () => {
      const res = await fetch("/api/admin/home-services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [slot1, slot2].filter(Boolean) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Не удалось сохранить");
        return;
      }
      setMessage("Карточки на главной обновлены.");
      router.refresh();
    });
  }

  return (
    <section className="cabinet-card mt-6 p-5 md:p-6">
      <h2 className="font-display text-xl font-bold text-ink">Карточки на главной</h2>
      <p className="mt-1 text-sm text-ink/60">
        На первом экране сайта показываются две выбранные услуги и ссылка
        «Другие услуги». Порядок — сверху вниз в форме, слева направо на сайте.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Первая карточка</span>
          <select
            className="field"
            value={slot1}
            aria-label="Первая карточка на главной"
            onChange={(e) => setSlot1(e.target.value)}
          >
            <option value="">Не выбрано</option>
            {options.map((item) => (
              <option key={item.id} value={item.id} disabled={item.id === slot2}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Вторая карточка</span>
          <select
            className="field"
            value={slot2}
            aria-label="Вторая карточка на главной"
            onChange={(e) => setSlot2(e.target.value)}
          >
            <option value="">Не выбрано</option>
            {options.map((item) => (
              <option key={item.id} value={item.id} disabled={item.id === slot1}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button className="btn-primary mt-4" disabled={pending} onClick={save}>
        Сохранить главную
      </button>
      {message ? <p className="mt-2 text-sm text-ink/70">{message}</p> : null}
    </section>
  );
}
