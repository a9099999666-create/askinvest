"use client";

import { useEffect, useState, useTransition } from "react";
import type { ChannelKind } from "@/lib/channels";

type ChannelStatus = { kind: ChannelKind; configured: boolean };

export function InquiryChat({
  topic,
  sourcePage,
  serviceId,
  propertyId,
  channelStatus = [],
  placement = "right",
}: {
  topic: string;
  sourcePage: string;
  serviceId?: string;
  propertyId?: string;
  channelStatus?: ChannelStatus[];
  placement?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (window.matchMedia("(max-width: 767px)").matches) return;
    const timer = window.setTimeout(() => setOpen(true), 700);
    return () => window.clearTimeout(timer);
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    start(async () => {
      const configured = channelStatus.filter((item) => item.configured);
      if (!configured.length && !replyTo.trim()) {
        setError("Укажите телефон или email, чтобы мы ответили.");
        return;
      }
      const publicKey =
        sessionStorage.getItem(`askinvest_chat_${sourcePage}`) ||
        Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem(`askinvest_chat_${sourcePage}`, publicKey);
      const payload: Record<string, string> = {
        question: question.trim() || `Вопрос по: ${topic}`,
        channel: configured[0]?.kind || "telegram",
        replyTo: replyTo.trim(),
        sourcePage,
        intent: "chat",
        publicKey,
      };
      if (serviceId) payload.serviceId = serviceId;
      if (propertyId) payload.propertyId = propertyId;
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setError("Не удалось отправить. Проверьте контакт и попробуйте ещё раз.");
        return;
      }
      setDone(true);
    });
  }

  return (
    <div
      className={
        placement === "left"
          ? "fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 right-4 z-40 sm:right-auto sm:w-[min(100%-2rem,340px)]"
          : "fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 right-4 z-40 sm:left-auto sm:right-4 sm:w-[min(100%-2rem,340px)]"
      }
    >
      {open ? (
        <div className="chat-in form-panel glass-panel overflow-hidden rounded-[24px] shadow-panel">
          <div className="flex items-start justify-between gap-3 px-4 pb-2 pt-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                Чат
              </p>
              <p className="mt-1 font-display text-xl font-semibold leading-tight text-ink">
                Вопрос по «{topic}»?
              </p>
            </div>
            <button
              type="button"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 text-lg text-ink/80"
              onClick={() => setOpen(false)}
              aria-label="Свернуть чат"
            >
              ×
            </button>
          </div>
          {done ? (
            <p className="px-4 pb-4 text-sm text-emerald-300">
              Заявка принята. Ответим в рабочие часы.
            </p>
          ) : (
            <form className="px-4 pb-4" onSubmit={submit}>
              <textarea
                className="field min-h-[72px] resize-y"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Напишите вопрос…"
                required
              />
              <input
                className="field mt-2"
                value={replyTo}
                onChange={(e) => setReplyTo(e.target.value)}
                placeholder="Телефон или email"
                autoComplete="tel"
              />
              {error ? <p className="field-error">{error}</p> : null}
              <button className="btn-primary mt-3 w-full !justify-between" type="submit" disabled={pending}>
                <span>{pending ? "Отправляем…" : "Отправить"}</span>
                <span aria-hidden>→</span>
              </button>
            </form>
          )}
        </div>
      ) : (
        <button
          type="button"
          className="btn-primary ml-auto flex shadow-panel"
          onClick={() => setOpen(true)}
        >
          Спросить
        </button>
      )}
    </div>
  );
}
