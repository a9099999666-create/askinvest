"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Thread = {
  id: string;
  channel: string;
  mode: string;
  lastPreview: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  leadId: string | null;
  operatorId: string | null;
};

type Message = {
  id: string;
  authorType: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
  status: string;
};

type Lead = {
  id: string;
  question: string;
  stage: string;
  channel: string;
  serviceTitleSnapshot: string | null;
  propertyTitleSnapshot: string | null;
  note: string | null;
} | null;

export function InboxClient({
  threads,
  initialThreadId,
  messages,
  lead,
  currentUserId,
}: {
  threads: Thread[];
  initialThreadId?: string;
  messages: Message[];
  lead: Lead;
  currentUserId: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(initialThreadId || threads[0]?.id);
  const [panel, setPanel] = useState<"list" | "chat" | "lead">("chat");
  const [text, setText] = useState("");
  const [internal, setInternal] = useState(false);
  const [pending, start] = useTransition();

  const thread = useMemo(
    () => threads.find((t) => t.id === selected),
    [threads, selected],
  );

  function openThread(id: string) {
    setSelected(id);
    setPanel("chat");
    router.push(`/admin/inbox?thread=${id}`);
    router.refresh();
  }

  function take() {
    if (!selected) return;
    start(async () => {
      await fetch(`/api/admin/threads/${selected}/take`, { method: "POST" });
      router.refresh();
    });
  }

  function release() {
    if (!selected) return;
    start(async () => {
      await fetch(`/api/admin/threads/${selected}/release`, { method: "POST" });
      router.refresh();
    });
  }

  function send() {
    if (!selected || !text.trim()) return;
    start(async () => {
      await fetch(`/api/admin/threads/${selected}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text, isInternal: internal }),
      });
      setText("");
      router.refresh();
    });
  }

  return (
    <div className="grid min-h-[70vh] gap-3 lg:grid-cols-[280px_1fr_280px]">
      <div
        className={`rounded-2xl bg-white/80 p-3 ${
          panel === "list" ? "block" : "hidden lg:block"
        }`}
      >
        <h1 className="px-2 text-xl font-bold">Диалоги</h1>
        <ul className="mt-3 space-y-1">
          {threads.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => openThread(t.id)}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm ${
                  selected === t.id
                    ? "border-l-2 border-brand-red bg-sky-50"
                    : "hover:bg-slate-50"
                }`}
              >
                <div className="flex justify-between gap-2">
                  <span className="font-semibold uppercase">{t.channel}</span>
                  {t.unreadCount > 0 && (
                    <span className="rounded-full bg-brand-red px-1.5 text-xs text-white">
                      {t.unreadCount}
                    </span>
                  )}
                </div>
                <div className="line-clamp-2 text-ink/60">{t.lastPreview}</div>
              </button>
            </li>
          ))}
          {threads.length === 0 && (
            <li className="px-2 text-sm text-ink/60">Пока нет диалогов</li>
          )}
        </ul>
      </div>

      <div
        className={`flex flex-col rounded-2xl bg-white/80 ${
          panel === "chat" ? "flex" : "hidden lg:flex"
        }`}
      >
        {thread ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
              <div>
                <button
                  type="button"
                  className="mr-2 text-sm text-brand-blue lg:hidden"
                  onClick={() => setPanel("list")}
                >
                  ← Список
                </button>
                <span className="font-semibold uppercase">{thread.channel}</span>
                <span className="ml-2 text-sm text-ink/60">
                  {thread.mode === "bot" ? "Отвечает бот" : "Ведёт сотрудник"}
                </span>
              </div>
              <div className="flex gap-2">
                {thread.mode === "bot" ? (
                  <button className="btn-primary" onClick={take} disabled={pending}>
                    Взять диалог
                  </button>
                ) : (
                  <button className="btn-ghost" onClick={release} disabled={pending}>
                    Вернуть боту
                  </button>
                )}
                <button
                  type="button"
                  className="btn-ghost lg:hidden"
                  onClick={() => setPanel("lead")}
                >
                  Заявка
                </button>
              </div>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    m.isInternal
                      ? "bg-amber-50 text-amber-900"
                      : m.authorType === "client"
                        ? "bg-slate-100"
                        : "ml-auto bg-sky-100"
                  }`}
                >
                  <div className="text-[10px] uppercase opacity-60">
                    {m.isInternal ? "заметка" : m.authorType} · {m.status}
                  </div>
                  <div className="whitespace-pre-wrap">{m.body}</div>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-100 p-3">
              <label className="mb-2 flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={internal}
                  onChange={(e) => setInternal(e.target.checked)}
                />
                Внутренняя заметка
              </label>
              <div className="flex gap-2">
                <input
                  className="field"
                  placeholder="Сообщение..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                <button className="btn-primary" onClick={send} disabled={pending}>
                  →
                </button>
              </div>
              {thread.operatorId && thread.operatorId !== currentUserId && (
                <p className="mt-2 text-xs text-ink/60">
                  Диалог уже ведёт другой сотрудник.
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="p-6 text-ink/60">Выберите диалог</div>
        )}
      </div>

      <div
        className={`rounded-2xl bg-white/80 p-4 ${
          panel === "lead" ? "block" : "hidden lg:block"
        }`}
      >
        <button
          type="button"
          className="mb-2 text-sm text-brand-blue lg:hidden"
          onClick={() => setPanel("chat")}
        >
          ← Чат
        </button>
        <h2 className="font-semibold">Заявка</h2>
        {lead ? (
          <div className="mt-3 space-y-2 text-sm">
            <p>{lead.question}</p>
            <p>Статус: {lead.stage}</p>
            <p>Канал: {lead.channel}</p>
            <p>
              {lead.serviceTitleSnapshot || lead.propertyTitleSnapshot || "—"}
            </p>
            <p className="text-ink/60">{lead.note}</p>
            <a className="text-brand-blue" href={`/admin/leads/${lead.id}`}>
              Открыть карточку →
            </a>
          </div>
        ) : (
          <p className="mt-3 text-sm text-ink/60">
            Заявка не привязана. Можно связать вручную в карточке CRM.
          </p>
        )}
      </div>
    </div>
  );
}
