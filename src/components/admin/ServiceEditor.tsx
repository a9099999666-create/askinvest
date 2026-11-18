"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { nanoid } from "@/lib/utils";
import { PageTitle } from "./PageTitle";
import { IconCheck, IconGrip } from "./icons";

type WorkItem = { id: string; text: string };

export function ServiceEditor({
  serviceId,
  heading,
  initial,
  canPublish,
}: {
  serviceId?: string;
  heading: string;
  initial?: {
    title: string;
    shortDescription: string;
    fullDescription: string;
    workItems: WorkItem[];
    updatedAt: string;
    status: string;
  };
  canPublish: boolean;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title || "");
  const [shortDescription, setShort] = useState(initial?.shortDescription || "");
  const [fullDescription, setFull] = useState(initial?.fullDescription || "");
  const [workItems, setItems] = useState<WorkItem[]>(
    initial?.workItems?.length ? initial.workItems : [{ id: nanoid(), text: "" }],
  );
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [updatedAt, setUpdatedAt] = useState(initial?.updatedAt || "");
  const [conflict, setConflict] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  function dropOn(index: number) {
    if (dragIndex === null || dragIndex === index) return;
    const next = [...workItems];
    const [item] = next.splice(dragIndex, 1);
    next.splice(index, 0, item);
    setItems(next);
    setDragIndex(null);
  }

  function save(extra?: { status?: "draft" | "review"; publish?: boolean }) {
    setError("");
    setConflict(null);
    start(async () => {
      const payload = {
        title,
        shortDescription,
        fullDescription,
        workItems: workItems.filter((w) => w.text.trim()),
        expectedUpdatedAt: updatedAt,
        status: extra?.status,
      };
      const url = serviceId ? `/api/admin/services/${serviceId}` : "/api/admin/services";
      const res = await fetch(url, {
        method: serviceId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.status === 409) {
        setConflict(JSON.stringify(data.current, null, 2));
        setError("Версия устарела. Сверьте изменения.");
        return;
      }
      if (!res.ok) {
        setError(data.error || "Ошибка сохранения");
        return;
      }
      const id = serviceId || data.service.id;
      if (data.version?.updatedAt) setUpdatedAt(data.version.updatedAt);
      if (extra?.publish) {
        const pub = await fetch(`/api/admin/services/${id}/publish`, { method: "POST" });
        const pubData = await pub.json();
        if (!pub.ok) {
          setError(pubData.error || "Не удалось опубликовать");
          return;
        }
      }
      router.push(`/admin/services/${id}`);
      router.refresh();
    });
  }

  const points = workItems.filter((w) => w.text.trim());

  return (
    <div>
      <PageTitle title={heading} />
      <div className="mt-6 grid items-start gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[28px] bg-white p-5 shadow-panel md:p-6">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">Название</span>
            <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="mt-4 block">
            <span className="mb-1.5 block text-sm font-semibold">Краткое описание</span>
            <textarea
              className="field min-h-20 resize-y"
              value={shortDescription}
              onChange={(e) => setShort(e.target.value)}
            />
          </label>
          <div className="mt-4">
            <div className="mb-2 text-sm font-semibold">Что входит в услугу</div>
            <div className="space-y-2">
              {workItems.map((item, i) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => setDragIndex(i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => dropOn(i)}
                  className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3"
                >
                  <IconGrip className="shrink-0 cursor-grab text-slate-300" />
                  <input
                    className="w-full bg-transparent py-3 outline-none"
                    value={item.text}
                    onChange={(e) => {
                      const next = [...workItems];
                      next[i] = { ...item, text: e.target.value };
                      setItems(next);
                    }}
                  />
                  <button
                    type="button"
                    className="grid h-7 w-7 place-items-center rounded-full text-slate-400 hover:bg-slate-100"
                    onClick={() => setItems(workItems.filter((w) => w.id !== item.id))}
                    aria-label="Удалить пункт"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-ink/80"
              onClick={() => setItems([...workItems, { id: nanoid(), text: "" }])}
            >
              + Добавить пункт
            </button>
          </div>
          <label className="mt-4 block">
            <span className="mb-1.5 block text-sm font-semibold">Подробное описание</span>
            <textarea
              className="field min-h-24 resize-y"
              value={fullDescription}
              onChange={(e) => setFull(e.target.value)}
            />
          </label>
        </div>

        <aside className="rounded-[28px] bg-white p-5 shadow-panel">
          <div className="text-sm text-ink/45">Предпросмотр</div>
          <div className="mt-3 overflow-hidden rounded-2xl bg-gradient-to-b from-sky-50 to-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/catalog-glass.png" alt="" className="mx-auto w-full max-w-xs" />
          </div>
          <h2 className="mt-4 text-2xl font-bold leading-tight text-ink">
            {title || "Без названия"}
          </h2>
          <p className="mt-2 text-sm text-ink/60">{shortDescription}</p>
          <ul className="mt-4 space-y-2">
            {points.map((item) => (
              <li key={item.id} className="flex items-start gap-2 text-sm text-ink">
                <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                {item.text}
              </li>
            ))}
          </ul>
          <div className="mt-4 text-right text-xl text-[#ff3142]" aria-hidden>
            →
          </div>
        </aside>
      </div>

      {error && <p className="field-error mt-3">{error}</p>}
      {conflict && (
        <pre className="mt-3 max-h-40 overflow-auto rounded-2xl bg-amber-50 p-3 text-xs">{conflict}</pre>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <button
          className="btn-ghost w-full py-3.5 text-base"
          disabled={pending}
          onClick={() => save({ status: "draft" })}
        >
          Сохранить черновик
        </button>
        {canPublish ? (
          <button
            className="btn-primary w-full py-3.5 text-base"
            disabled={pending}
            onClick={() => save({ publish: true })}
          >
            Опубликовать
          </button>
        ) : (
          <button
            className="btn-primary w-full justify-between py-3.5 text-base"
            disabled={pending}
            onClick={() => save({ status: "review" })}
          >
            <span>Отправить на проверку</span>
            <span aria-hidden>→</span>
          </button>
        )}
      </div>
      {serviceId && canPublish && (
        <button
          className="mt-3 text-sm font-semibold text-ink/50"
          disabled={pending}
          onClick={() =>
            start(async () => {
              await fetch(`/api/admin/services/${serviceId}/unpublish`, { method: "POST" });
              router.refresh();
            })
          }
        >
          Снять с публикации
        </button>
      )}
    </div>
  );
}
