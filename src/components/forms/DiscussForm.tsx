"use client";

import { useMemo, useState, useTransition } from "react";
import { nanoid } from "@/lib/utils";
import type { ChannelKind } from "@/lib/channels";
import { MaxIcon, TelegramIcon, WhatsIcon } from "@/components/icons/channels";

const channels: {
  id: ChannelKind;
  label: string;
  icon: React.ReactNode;
}[] = [
  { id: "telegram", label: "Telegram", icon: <TelegramIcon className="h-5 w-5" /> },
  { id: "max", label: "MAX", icon: <MaxIcon className="h-5 w-5" /> },
  { id: "whatsapp", label: "WhatsApp", icon: <WhatsIcon className="h-5 w-5" /> },
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
    <div className="glass-panel animate-rise rounded-[28px] p-6 md:p-7">
      <h2 className="font-display text-[28px] font-bold leading-none text-ink">
        {title}
      </h2>
      <div className="mt-3 h-[3px] w-10 rounded bg-brand-red" />
      <label className="mt-5 block">
        <span className="sr-only">Вопрос</span>
        <textarea
          className="field min-h-[132px] resize-y bg-white"
          placeholder="Чем можем помочь?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          aria-invalid={Boolean(error)}
        />
      </label>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {channels.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setChannel(c.id)}
            className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-2 py-2.5 text-sm font-semibold transition ${
              channel === c.id
                ? "border-sky-300 bg-sky-50 text-ink shadow-sm"
                : "border-slate-200 bg-white text-ink hover:border-sky-200"
            }`}
            aria-pressed={channel === c.id}
          >
            {c.icon}
            {c.label}
          </button>
        ))}
      </div>
      {error && <p className="field-error">{error}</p>}
      <button
        type="button"
        className="btn-primary mt-5 w-full justify-between rounded-2xl px-5 py-3.5 text-base"
        onClick={submit}
        disabled={pending}
      >
        <span>{pending ? "Сохраняем…" : title}</span>
        <span aria-hidden className="text-xl">
          →
        </span>
      </button>
    </div>
  );
}
