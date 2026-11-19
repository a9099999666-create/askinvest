"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { workIcons, type WorkIconKind, type WorkItem } from "@/lib/content/kinds";
import { nanoid, slugify } from "@/lib/utils";
import { WorkIcon } from "@/components/public/WorkIcon";
import { PageTitle } from "./PageTitle";
import { IconGrip } from "./icons";

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
    slug: string;
    shortDescription: string;
    fullDescription: string;
    workItems: WorkItem[];
    imageId: string | null;
    sortOrder: number;
    updatedAt: string;
    status: string;
    published: boolean;
  };
  canPublish: boolean;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const [shortDescription, setShort] = useState(initial?.shortDescription || "");
  const [fullDescription, setFull] = useState(initial?.fullDescription || "");
  const [imageId, setImageId] = useState<string | null>(initial?.imageId || null);
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? ""));
  const [workItems, setItems] = useState<WorkItem[]>(
    initial?.workItems?.length ? initial.workItems : [{ id: nanoid(), text: "" }],
  );
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [updatedAt, setUpdatedAt] = useState(initial?.updatedAt || "");
  const [status, setStatus] = useState(initial?.status || "draft");
  const [conflict, setConflict] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [pending, start] = useTransition();

  function dropOn(index: number) {
    if (dragIndex === null || dragIndex === index) return;
    moveItem(dragIndex, index);
    setDragIndex(null);
  }

  function moveItem(from: number, to: number) {
    if (to < 0 || to >= workItems.length) return;
    const next = [...workItems];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setItems(next);
  }

  async function uploadCover(file: File) {
    setError("");
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/admin/media", { method: "POST", body });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Не удалось загрузить обложку");
      return;
    }
    setImageId(data.id);
  }

  function save(extra?: { status?: "draft" | "review"; publish?: boolean }) {
    setError("");
    setSaved("");
    setConflict(null);
    start(async () => {
      const payload = {
        title,
        slug: slug || slugify(title),
        shortDescription,
        fullDescription,
        imageId,
        sortOrder: sortOrder === "" ? undefined : Number(sortOrder),
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
      let nextVersion = data.version;
      if (!serviceId && extra?.status === "review" && nextVersion) {
        const reviewRes = await fetch(`/api/admin/services/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            expectedUpdatedAt: nextVersion.updatedAt,
            status: "review",
          }),
        });
        const reviewData = await reviewRes.json();
        if (!reviewRes.ok) {
          setError(reviewData.error || "Не удалось отправить на проверку");
          return;
        }
        nextVersion = reviewData.version;
      }
      if (nextVersion?.updatedAt) setUpdatedAt(nextVersion.updatedAt);
      if (nextVersion?.status) setStatus(nextVersion.status);
      if (extra?.publish) {
        const pub = await fetch(`/api/admin/services/${id}/publish`, { method: "POST" });
        const pubData = await pub.json();
        if (!pub.ok) {
          setError(pubData.error || "Не удалось опубликовать");
          return;
        }
        if (pubData.version?.updatedAt) setUpdatedAt(pubData.version.updatedAt);
        if (pubData.version?.status) setStatus(pubData.version.status);
      }
      if (extra?.publish) setSaved("Опубликовано. Посетители видят эту версию.");
      else if (extra?.status === "review") setSaved("Отправлено на проверку.");
      else setSaved("Черновик сохранён.");
      if (!serviceId) {
        router.push(`/admin/services/${id}`);
      }
      router.refresh();
    });
  }

  const points = workItems.filter((w) => w.text.trim());

  return (
    <div>
      <PageTitle title={heading} />
      {initial?.published ? (
        <p className="mt-3 text-sm text-ink/60">
          Посетители сейчас видят опубликованную версию. Сохранение правок создаёт
          черновик и не меняет сайт, пока вы не опубликуете.
        </p>
      ) : null}
      {status === "review" ? (
        <p className="mt-3 text-sm text-amber-700">Черновик отправлен на проверку.</p>
      ) : null}
      <div className="mt-6 grid items-start gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[28px] bg-white p-5 shadow-panel md:p-6">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">Название</span>
            <input
              className="field"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
            />
          </label>
          <label className="mt-4 block">
            <span className="mb-1.5 block text-sm font-semibold">Адрес страницы</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-ink/45">/services/</span>
              <input
                className="field"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
              />
            </div>
          </label>
          <label className="mt-4 block">
            <span className="mb-1.5 block text-sm font-semibold">Обложка для каталога</span>
            <input
              className="field"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadCover(file);
              }}
            />
            {imageId ? (
              <div className="mt-2 flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/media/${imageId}`}
                  alt=""
                  className="h-14 w-20 rounded-xl object-cover"
                />
                <button
                  type="button"
                  className="text-sm font-semibold text-ink/50"
                  onClick={() => setImageId(null)}
                >
                  Убрать обложку
                </button>
              </div>
            ) : null}
          </label>
          <label className="mt-4 block">
            <span className="mb-1.5 block text-sm font-semibold">Порядок в каталоге</span>
            <input
              className="field"
              type="number"
              min={1}
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              placeholder="Чем меньше число, тем выше в списке"
            />
          </label>
          <label className="mt-4 block">
            <span className="mb-1.5 block text-sm font-semibold">Краткое описание</span>
            <textarea
              className="field min-h-20 resize-y"
              value={shortDescription}
              onChange={(e) => setShort(e.target.value)}
            />
          </label>
          <label className="mt-4 block">
            <span className="mb-1.5 block text-sm font-semibold">Полное описание</span>
            <textarea
              className="field min-h-24 resize-y"
              value={fullDescription}
              onChange={(e) => setFull(e.target.value)}
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
                  <button
                    type="button"
                    className="shrink-0"
                    title="Сменить иконку"
                    onClick={() => {
                      const next = [...workItems];
                      const current = workIcons.indexOf((item.icon || workIcons[i % 3]) as WorkIconKind);
                      next[i] = { ...item, icon: workIcons[(current + 1) % workIcons.length] };
                      setItems(next);
                    }}
                  >
                    <WorkIcon kind={item.icon || workIcons[i % 3]} />
                  </button>
                  <input
                    className="w-full bg-transparent py-3 outline-none"
                    value={item.text}
                    placeholder="Проверим документы"
                    onChange={(e) => {
                      const next = [...workItems];
                      next[i] = { ...item, text: e.target.value };
                      setItems(next);
                    }}
                  />
                  <button
                    type="button"
                    className="text-xs font-semibold text-ink/40"
                    aria-label="Переместить вверх"
                    onClick={() => moveItem(i, i - 1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="text-xs font-semibold text-ink/40"
                    aria-label="Переместить вниз"
                    onClick={() => moveItem(i, i + 1)}
                  >
                    ↓
                  </button>
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
              onClick={() =>
                setItems([
                  ...workItems,
                  { id: nanoid(), text: "", icon: workIcons[workItems.length % workIcons.length] },
                ])
              }
            >
              + Добавить пункт
            </button>
          </div>
        </div>

        <aside className="rounded-[28px] bg-white p-5 shadow-panel">
          <div className="text-sm text-ink/45">Предпросмотр</div>
          <div className="mt-3 overflow-hidden rounded-2xl bg-gradient-to-b from-sky-50 to-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/catalog-glass.webp"
              alt=""
              className="mx-auto h-36 w-full object-contain object-bottom"
            />
          </div>
          <h2 className="mt-4 text-2xl font-bold leading-tight text-ink">
            {title || "Без названия"}
          </h2>
          <p className="mt-2 text-sm text-ink/60">{shortDescription}</p>
          <div className="mt-4 text-sm font-semibold text-ink">Чем поможем:</div>
          <ul className="mt-2 space-y-2">
            {points.map((item, index) => (
              <li key={item.id} className="flex items-center gap-2 text-sm text-ink">
                <WorkIcon kind={item.icon || workIcons[index % workIcons.length]} />
                {item.text}
              </li>
            ))}
          </ul>
          <div className="mt-4 text-right text-xl text-[#ff3142]" aria-hidden>
            →
          </div>
          {serviceId && slug ? (
            <Link
              href={`/services/${slug}`}
              className="mt-3 inline-block text-sm font-semibold text-brand-blue"
              target="_blank"
            >
              Открыть глазами клиента
            </Link>
          ) : null}
        </aside>
      </div>

      {saved && <p className="mt-3 text-sm font-medium text-emerald-700">{saved}</p>}
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
      {serviceId && canPublish && initial?.published ? (
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
      ) : null}
    </div>
  );
}
