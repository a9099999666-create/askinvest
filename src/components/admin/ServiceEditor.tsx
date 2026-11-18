"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { nanoid } from "@/lib/utils";

type WorkItem = { id: string; text: string };

export function ServiceEditor({
  serviceId,
  initial,
  canPublish,
}: {
  serviceId?: string;
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
    initial?.workItems || [{ id: nanoid(), text: "" }],
  );
  const [updatedAt, setUpdatedAt] = useState(initial?.updatedAt || "");
  const [conflict, setConflict] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= workItems.length) return;
    const next = [...workItems];
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
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
      const url = serviceId
        ? `/api/admin/services/${serviceId}`
        : "/api/admin/services";
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
        const pub = await fetch(`/api/admin/services/${id}/publish`, {
          method: "POST",
        });
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

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-3 rounded-2xl bg-white/80 p-5">
        <label className="block">
          <span className="mb-1 block text-sm">Название</span>
          <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm">Краткое описание</span>
          <textarea className="field" value={shortDescription} onChange={(e) => setShort(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm">Полное описание</span>
          <textarea className="field min-h-28" value={fullDescription} onChange={(e) => setFull(e.target.value)} />
        </label>
        <div>
          <div className="mb-2 text-sm font-semibold">Состав услуги</div>
          {workItems.map((item, i) => (
            <div key={item.id} className="mb-2 flex gap-2">
              <input
                className="field"
                value={item.text}
                onChange={(e) => {
                  const next = [...workItems];
                  next[i] = { ...item, text: e.target.value };
                  setItems(next);
                }}
              />
              <button type="button" className="btn-ghost" onClick={() => move(i, -1)}>↑</button>
              <button type="button" className="btn-ghost" onClick={() => move(i, 1)}>↓</button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setItems(workItems.filter((w) => w.id !== item.id))}
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setItems([...workItems, { id: nanoid(), text: "" }])}
          >
            + Пункт
          </button>
        </div>
        {error && <p className="field-error">{error}</p>}
        {conflict && (
          <pre className="max-h-40 overflow-auto rounded bg-amber-50 p-3 text-xs">
            {conflict}
          </pre>
        )}
        <div className="flex flex-wrap gap-2 pt-2">
          <button className="btn-primary" disabled={pending} onClick={() => save({ status: "draft" })}>
            Сохранить черновик
          </button>
          {!canPublish && (
            <button className="btn-ghost" disabled={pending} onClick={() => save({ status: "review" })}>
              Отправить на проверку
            </button>
          )}
          {canPublish && (
            <button className="btn-primary" disabled={pending} onClick={() => save({ publish: true })}>
              Опубликовать
            </button>
          )}
          {serviceId && canPublish && (
            <button
              className="btn-ghost"
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
      </div>
      <div className="rounded-2xl bg-white/80 p-5">
        <div className="text-sm text-ink/50">Предпросмотр</div>
        <h2 className="mt-2 text-2xl font-bold">{title || "Без названия"}</h2>
        <p className="mt-2 text-ink/70">{shortDescription}</p>
        <ol className="mt-4 list-decimal space-y-1 pl-5">
          {workItems.filter((w) => w.text.trim()).map((w) => (
            <li key={w.id}>{w.text}</li>
          ))}
        </ol>
        <p className="mt-4 whitespace-pre-wrap text-sm text-ink/80">{fullDescription}</p>
      </div>
    </div>
  );
}
