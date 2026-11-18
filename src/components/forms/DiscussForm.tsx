"use client";

import { useMemo, useState, useTransition } from "react";
import { nanoid } from "@/lib/utils";
import type { ChannelKind } from "@/lib/channels";

const channels: { id: ChannelKind; label: string; color: string }[] = [
  { id: "telegram", label: "Telegram", color: "#2AABEE" },
  { id: "max", label: "MAX", color: "#1a7adf" },
  { id: "whatsapp", label: "WhatsApp", color: "#25D366" },
];

export function DiscussForm({
  serviceId,
  propertyId,
  intent = "discuss",
  sourcePage,
  title = "Обсудить задачу",
}: {
  serviceId?: string;
  propertyId?: string;
  intent?: string;
  sourcePage?: string;
  title?: string;
}) {
  const [question, setQuestion] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [channel, setChannel] = useState<ChannelKind>("telegram");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const publicKey = useMemo(() => nanoid(), []);

  function submit() {
    setError("");
    if (!question.trim()) {
      setError("Опишите задачу");
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question,
            channel,
            publicKey,
            visitorName: name || undefined,
            visitorPhone: phone || undefined,
            serviceId,
            propertyId,
            intent,
            sourcePage: sourcePage || window.location.pathname,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Не удалось сохранить");
        if (!data.deepLink) {
          throw new Error(
            "Выбранный канал пока недоступен. Попробуйте другой или повторите позже.",
          );
        }
        window.location.href = data.deepLink;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ошибка сохранения");
      }
    });
  }

  return (
    <div className="glass-panel animate-rise rounded-3xl p-6 md:p-8">
      <h2 className="font-display text-2xl font-bold text-ink">{title}</h2>
      <div className="mt-2 h-0.5 w-10 rounded bg-brand-red" />
      <label className="mt-5 block">
        <span className="sr-only">Вопрос</span>
        <textarea
          className="field min-h-28 resize-y"
          placeholder="Чем можем помочь?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          aria-invalid={Boolean(error)}
        />
      </label>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <label>
          <span className="mb-1 block text-xs text-ink/60">Имя (необязательно)</span>
          <input
            className="field"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          <span className="mb-1 block text-xs text-ink/60">
            Телефон (необязательно)
          </span>
          <input
            className="field"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {channels.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setChannel(c.id)}
            className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
              channel === c.id
                ? "border-transparent text-white"
                : "border-slate-200 bg-white/80 text-ink"
            }`}
            style={
              channel === c.id ? { backgroundColor: c.color } : undefined
            }
            aria-pressed={channel === c.id}
          >
            {c.label}
          </button>
        ))}
      </div>
      {error && <p className="field-error">{error}</p>}
      <button
        type="button"
        className="btn-primary mt-5 w-full"
        onClick={submit}
        disabled={pending}
      >
        {pending ? "Сохраняем…" : "Обсудить задачу"}
        <span aria-hidden>→</span>
      </button>
    </div>
  );
}
