"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { nanoid } from "@/lib/utils";
import type { ChannelKind } from "@/lib/channels";

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#2AABEE"
        d="M21.5 4.4 2.7 11.6c-1.3.5-1.3 1.2-.2 1.5l4.8 1.5 11.2-7.1c.5-.3 1-.1.6.2l-9.1 8.2-.3 4.6c.5 0 .7-.2 1-.5l2.4-2.3 5 3.7c.9.5 1.6.2 1.8-.9l3.3-15.4c.3-1.3-.5-1.9-1.7-1.5Z"
      />
    </svg>
  );
}

function MaxIcon() {
  return (
    <span className="grid h-4 w-4 place-items-center rounded-full bg-[#7b5cff] text-[9px] font-bold text-white">
      M
    </span>
  );
}

function WhatsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#25D366"
        d="M12 3.2A8.7 8.7 0 0 0 4.5 16.3L3.4 20.6l4.4-1.1A8.8 8.8 0 1 0 12 3.2Zm5 12.3c-.2.6-1.2 1.1-1.7 1.1-.4.1-.9.1-1.5-.1-.3-.1-.7-.3-1.2-.5-2.1-1.1-3.5-3.2-3.6-3.4-.1-.2-.9-1.2-.9-2.3s.6-1.6.8-1.8c.2-.2.4-.3.6-.3h.4c.1 0 .3 0 .4.3.2.5.6 1.6.6 1.7.1.1 0 .3-.1.4l-.3.4c-.1.1-.2.3-.1.4.2.3.7 1.1 1.5 1.8 1 .9 1.8 1.1 2.1 1.3.2.1.4.1.5-.1l.6-.7c.2-.2.3-.2.5-.1.2.1 1.4.7 1.6.8.2.1.4.2.4.3 0 .2 0 .7-.2 1.1Z"
      />
    </svg>
  );
}

const channels: {
  id: ChannelKind;
  label: string;
  icon: ReactNode;
}[] = [
  { id: "telegram", label: "Telegram", icon: <TelegramIcon /> },
  { id: "max", label: "MAX", icon: <MaxIcon /> },
  { id: "whatsapp", label: "WhatsApp", icon: <WhatsIcon /> },
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
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label>
          <span className="mb-1 block text-xs text-ink/50">
            Имя (необязательно)
          </span>
          <input
            className="field bg-white"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          <span className="mb-1 block text-xs text-ink/50">
            Телефон (необязательно)
          </span>
          <input
            className="field bg-white"
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
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition ${
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
