"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { channelIcon, channelLabel } from "@/components/icons/channels";
import { leadStageLabel } from "@/lib/crm/stages";
import { PageTitle } from "./PageTitle";
import { IconDoc, IconSearch } from "./icons";

type Thread = {
  id: string;
  channel: string;
  mode: string;
  lastPreview: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  leadId: string | null;
  operatorId: string | null;
  title: string;
};

type Message = {
  id: string;
  authorType: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
  status: string;
  mediaId: string | null;
  mediaName: string | null;
};

type Lead = {
  id: string;
  number: string;
  question: string;
  stage: string;
  channel: string;
  serviceTitleSnapshot: string | null;
  propertyTitleSnapshot: string | null;
  note: string | null;
  visitorName: string | null;
  visitorPhone: string | null;
  visitorEmail: string | null;
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
  const [menu, setMenu] = useState(false);
  const [channel, setChannel] = useState("all");
  const [mode, setMode] = useState("all");
  const [q, setQ] = useState("");
  const [pending, start] = useTransition();

  const visible = useMemo(() => {
    const query = q.trim().toLowerCase();
    return threads.filter((thread) => {
      if (channel !== "all" && thread.channel !== channel) return false;
      if (mode !== "all" && thread.mode !== mode) return false;
      if (!query) return true;
      return `${thread.title} ${thread.lastPreview || ""}`.toLowerCase().includes(query);
    });
  }, [channel, mode, q, threads]);

  const thread = threads.find((item) => item.id === selected);

  function openThread(id: string) {
    setSelected(id);
    setPanel("chat");
    router.push(`/cabinet/inbox?thread=${id}`);
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
    <div>
      <PageTitle title="Диалоги" subtitle="Переписка по заявкам из форм и каналов." />
      <div className="cabinet-card mt-5 grid min-h-[min(620px,calc(100dvh-9rem))] overflow-hidden lg:grid-cols-[320px_1fr_270px]">
        <div className={`${panel === "list" ? "block" : "hidden lg:block"} border-slate-100 lg:border-r`}>
          <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-[1fr_1fr_4.5rem]">
            <select className="field min-w-0 !px-2 !py-2 text-xs" value={channel} onChange={(e) => setChannel(e.target.value)}>
              <option value="all">Все каналы</option>
              <option value="telegram">Telegram</option>
              <option value="max">MAX</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="test">Тест</option>
            </select>
            <select className="field min-w-0 !px-2 !py-2 text-xs" value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="all">Все диалоги</option>
              <option value="bot">Отвечает бот</option>
              <option value="human">Сотрудник</option>
            </select>
            <label className="relative col-span-2 sm:col-span-1">
              <IconSearch className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="field w-full !py-2 !pl-7 !pr-2 text-xs"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Поиск диалога"
              />
            </label>
          </div>
          <ul className="space-y-1 px-2 pb-3">
            {visible.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => openThread(item.id)}
                  className={`flex w-full gap-2 rounded-2xl px-2 py-2.5 text-left ${
                    selected === item.id ? "bg-sky-50" : "hover:bg-slate-50"
                  }`}
                >
                  <span className="mt-0.5">{channelIcon(item.channel, "h-5 w-5")}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-ink">{item.title}</span>
                      <span className="shrink-0 text-[11px] text-ink/40">
                        {item.lastMessageAt ? clock(item.lastMessageAt) : ""}
                      </span>
                    </span>
                    <span className="line-clamp-1 text-xs text-ink/50">{item.lastPreview}</span>
                  </span>
                </button>
              </li>
            ))}
            {visible.length === 0 && (
              <li className="px-3 py-6 text-sm text-ink/50">Пока нет диалогов</li>
            )}
          </ul>
        </div>

        <div className={`${panel === "chat" ? "flex" : "hidden lg:flex"} min-h-[560px] flex-col`}>
          {thread ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                <div className="flex items-center gap-2">
                  <button type="button" className="text-sm text-brand-blue lg:hidden" onClick={() => setPanel("list")}>
                    ←
                  </button>
                  {channelIcon(thread.channel, "h-5 w-5")}
                  <div>
                    <div className="font-semibold text-ink">{thread.title}</div>
                    <div className="text-xs text-ink/45">{channelLabel(thread.channel)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-sm text-ink/70">
                    <span className={`h-2 w-2 rounded-full ${thread.mode === "bot" ? "bg-emerald-500" : "bg-sky-500"}`} />
                    {thread.mode === "bot" ? "Отвечает бот" : "Ведёт сотрудник"}
                  </span>
                  {thread.mode === "bot" ? (
                    <button className="btn-primary px-3 py-2 text-sm" onClick={take} disabled={pending}>
                      Взять диалог
                    </button>
                  ) : (
                    <button className="btn-ghost px-3 py-2 text-sm" onClick={release} disabled={pending}>
                      Вернуть боту
                    </button>
                  )}
                  <button type="button" className="btn-ghost px-3 py-2 text-sm lg:hidden" onClick={() => setPanel("lead")}>
                    Заявка
                  </button>
                </div>
              </div>
              {lead && (
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-2 text-sm">
                  <span className="text-ink/70">
                    {lead.serviceTitleSnapshot
                      ? `Заинтересовала услуга: ${lead.serviceTitleSnapshot}`
                      : lead.propertyTitleSnapshot
                        ? `Объект: ${lead.propertyTitleSnapshot}`
                        : "Без привязки"}
                  </span>
                  <a className="font-semibold text-brand-blue" href={`/cabinet/leads/${lead.id}`}>
                    Заявка №{lead.number}
                  </a>
                </div>
              )}
              <div className="flex-1 space-y-3 overflow-y-auto bg-[#f8fbfe] p-4">
                {messages.map((message) => {
                  const mine = message.authorType !== "client";
                  return (
                    <div key={message.id} className={mine ? "flex justify-end gap-2" : "flex justify-start"}>
                      <div
                        className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm ${
                          message.isInternal
                            ? "bg-amber-50 text-amber-950"
                            : mine
                              ? "rounded-br-md bg-sky-100 text-ink"
                              : "rounded-bl-md bg-white text-ink shadow-sm"
                        }`}
                      >
                        {message.isInternal && (
                          <div className="mb-1 text-[10px] uppercase text-amber-700">заметка</div>
                        )}
                        <div className="whitespace-pre-wrap">{message.body}</div>
                        {message.mediaId && (
                          <a
                            href={`/api/media/${message.mediaId}`}
                            className="mt-2 flex items-center gap-2 rounded-xl bg-white/80 px-2 py-1.5 text-xs"
                          >
                            <IconDoc />
                            <span className="truncate">{message.mediaName || "Файл"}</span>
                          </a>
                        )}
                        <div className="mt-1 text-right text-[10px] text-ink/40">
                          {clock(message.createdAt)}
                          {mine && message.status !== "failed" ? " ✓✓" : ""}
                        </div>
                      </div>
                      {mine && !message.isInternal ? (
                        <span className="mt-auto grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-[10px] font-bold text-ink/50">
                          А
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-slate-100 p-3">
                {internal && (
                  <p className="mb-2 text-xs font-medium text-amber-700">Внутренняя заметка</p>
                )}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button
                      type="button"
                      className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-lg text-ink/60"
                      onClick={() => setMenu((v) => !v)}
                      aria-label="Ещё"
                    >
                      +
                    </button>
                    {menu && (
                      <button
                        type="button"
                        className="absolute bottom-12 left-0 z-10 w-48 rounded-2xl bg-white px-3 py-2 text-left text-sm shadow-panel"
                        onClick={() => {
                          setInternal((v) => !v);
                          setMenu(false);
                        }}
                      >
                        {internal ? "Обычное сообщение" : "Внутренняя заметка"}
                      </button>
                    )}
                  </div>
                  <input
                    className="field"
                    placeholder="Сообщение..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") send();
                    }}
                  />
                  <button
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-red text-white"
                    onClick={send}
                    disabled={pending}
                    aria-label="Отправить"
                  >
                    ➤
                  </button>
                </div>
                {thread.operatorId && thread.operatorId !== currentUserId && (
                  <p className="mt-2 text-xs text-ink/55">Диалог уже ведёт другой сотрудник.</p>
                )}
              </div>
            </>
          ) : (
            <div className="p-6 text-ink/60">Выберите диалог</div>
          )}
        </div>

        <div className={`${panel === "lead" ? "block" : "hidden lg:block"} border-slate-100 p-4 lg:border-l`}>
          <button type="button" className="mb-2 text-sm text-brand-blue lg:hidden" onClick={() => setPanel("chat")}>
            ← Чат
          </button>
          {lead ? (
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Заявка №{lead.number}</h2>
                <a href={`/cabinet/leads/${lead.id}`} className="text-brand-blue" aria-label="Открыть заявку">
                  ↗
                </a>
              </div>
              <Field label={lead.serviceTitleSnapshot ? "Заинтересовала услуга" : "Объект"}>
                {lead.serviceTitleSnapshot || lead.propertyTitleSnapshot || "—"}
              </Field>
              <Field label="Что спросил">{lead.question}</Field>
              <Field label="Куда ответить">
                {lead.visitorPhone || lead.visitorEmail || "—"}
              </Field>
              <Field label="Канал">
                <span className="inline-flex items-center gap-1.5">
                  {channelIcon(lead.channel)}
                  {channelLabel(lead.channel)}
                </span>
              </Field>
              <Field label="Клиент">{lead.visitorName || thread?.title || "—"}</Field>
              <Field label="Статус">
                <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                  {leadStageLabel(lead.stage)}
                </span>
              </Field>
              {lead.note ? (
                <Field label="Комментарий к заявке">
                  <p className="text-ink/70">{lead.note}</p>
                </Field>
              ) : null}
              <a className="inline-flex font-semibold text-brand-red" href={`/cabinet/leads/${lead.id}`}>
                Открыть карточку →
              </a>
            </div>
          ) : (
            <p className="text-sm text-ink/55">Заявка не привязана.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-ink/40">{label}</div>
      <div className="mt-1 font-medium text-ink">{children}</div>
    </div>
  );
}

function clock(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Вчера";
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}
