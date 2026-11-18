"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { InteriorShot } from "@/components/public/InteriorShot";
import { formatArea } from "@/lib/utils";
import { PageTitle } from "./PageTitle";
import { IconDoc, IconPin } from "./icons";

type Photo = { id: string };

export function PropertyEditor({
  propertyId,
  heading,
  initial,
  canPublish,
}: {
  propertyId?: string;
  heading: string;
  initial?: {
    title: string;
    address: string;
    dealType: "sale" | "rent";
    areaSqm: string;
    priceRub: string;
    priceUnit: "total" | "per_month";
    description: string;
    coverId?: string | null;
    galleryIds?: string[];
    floorPlanId?: string | null;
    floorPlanName?: string | null;
    floorPlanSize?: number | null;
    updatedAt: string;
  };
  canPublish: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: initial?.title || "",
    address: initial?.address || "",
    dealType: initial?.dealType || ("sale" as "sale" | "rent"),
    areaSqm: plainNumber(initial?.areaSqm || ""),
    priceRub: plainNumber(initial?.priceRub || ""),
    priceUnit: initial?.priceUnit || ("total" as "total" | "per_month"),
    description: initial?.description || "",
    coverId: initial?.coverId || null,
    galleryIds: initial?.galleryIds || ([] as string[]),
    floorPlanId: initial?.floorPlanId || null,
  });
  const [floorMeta, setFloorMeta] = useState(
    initial?.floorPlanName
      ? { name: initial.floorPlanName, size: initial.floorPlanSize || 0 }
      : null,
  );
  const [updatedAt, setUpdatedAt] = useState(initial?.updatedAt || "");
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState("");
  const [pending, start] = useTransition();

  const photos: Photo[] = [
    ...(form.coverId ? [{ id: form.coverId }] : []),
    ...form.galleryIds.filter((id) => id !== form.coverId).map((id) => ({ id })),
  ];

  async function upload(file: File, kind: "gallery" | "floor") {
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/admin/media", { method: "POST", body });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Ошибка загрузки");
    if (kind === "floor") {
      setForm((f) => ({ ...f, floorPlanId: data.id }));
      setFloorMeta({ name: file.name, size: file.size });
    }
    if (kind === "gallery") {
      setForm((f) => ({
        ...f,
        coverId: f.coverId || data.id,
        galleryIds: [...f.galleryIds, data.id],
      }));
    }
  }

  function removePhoto(id: string) {
    setForm((f) => {
      const galleryIds = f.galleryIds.filter((item) => item !== id);
      const coverId = f.coverId === id ? galleryIds[0] || null : f.coverId;
      return { ...f, galleryIds, coverId };
    });
  }

  function save(extra?: { publish?: boolean; status?: "draft" | "review" }) {
    setError("");
    setConflict("");
    start(async () => {
      const url = propertyId
        ? `/api/admin/properties/${propertyId}`
        : "/api/admin/properties";
      const res = await fetch(url, {
        method: propertyId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          title: form.title || previewTitle(form.address, form.areaSqm),
          expectedUpdatedAt: updatedAt,
          status: extra?.status,
        }),
      });
      const data = await res.json();
      if (res.status === 409) {
        setConflict(JSON.stringify(data.current, null, 2));
        setError("Версия устарела. Сверьте изменения.");
        return;
      }
      if (!res.ok) {
        setError(data.error || "Ошибка");
        return;
      }
      const id = propertyId || data.property.id;
      if (data.version?.updatedAt) setUpdatedAt(data.version.updatedAt);
      if (extra?.publish) {
        const pub = await fetch(`/api/admin/properties/${id}/publish`, { method: "POST" });
        const pubData = await pub.json();
        if (!pub.ok) {
          setError(pubData.error || "Публикация не удалась");
          return;
        }
      }
      router.push(`/admin/properties/${id}`);
      router.refresh();
    });
  }

  const title =
    form.title || previewTitle(form.address, form.areaSqm);
  const previewImage = form.coverId || form.galleryIds[0];

  return (
    <div>
      <PageTitle title={heading} />
      <div className="mt-6 grid items-start gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[28px] bg-white p-5 shadow-panel md:p-6">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-ink">Название</span>
            <input
              className="field"
              value={form.title}
              placeholder="Коммерческое помещение"
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </label>
          <label className="mt-4 block">
            <span className="mb-1.5 block text-sm font-semibold text-ink">Адрес</span>
            <span className="relative block">
              <IconPin className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="field pl-11"
                value={form.address}
                placeholder="Москва, ул. Ленинская, д. 15"
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </span>
          </label>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1.3fr_0.7fr]">
            <div>
              <span className="mb-1.5 block text-sm font-semibold text-ink">Тип сделки</span>
              <div className="grid grid-cols-2 gap-2">
                {(["sale", "rent"] as const).map((value) => {
                  const active = form.dealType === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          dealType: value,
                          priceUnit: value === "rent" ? "per_month" : "total",
                        })
                      }
                      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-semibold ${
                        active
                          ? "border-2 border-[#ff3142] bg-white text-ink"
                          : "border border-slate-200 bg-white text-ink/70"
                      }`}
                    >
                      <span
                        className={`h-4 w-4 rounded-full border-2 ${
                          active ? "border-[#ff3142] bg-[#ff3142] shadow-[inset_0_0_0_3px_white]" : "border-slate-300"
                        }`}
                      />
                      {value === "sale" ? "Продажа" : "Аренда"}
                    </button>
                  );
                })}
              </div>
            </div>
            <label>
              <span className="mb-1.5 block text-sm font-semibold text-ink">Площадь</span>
              <input
                className="field"
                inputMode="decimal"
                value={form.areaSqm ? `${formatArea(form.areaSqm)}` : ""}
                placeholder="350 м²"
                onChange={(e) =>
                  setForm({ ...form, areaSqm: e.target.value.replace(/[^\d.,]/g, "").replace(",", ".") })
                }
              />
            </label>
          </div>
          <label className="mt-4 block">
            <span className="mb-1.5 block text-sm font-semibold text-ink">Цена</span>
            <input
              className="field"
              inputMode="numeric"
              value={form.priceRub ? moneyLabel(form.priceRub, form.priceUnit) : ""}
              placeholder="85 000 000 ₽"
              onChange={(e) =>
                setForm({ ...form, priceRub: e.target.value.replace(/[^\d]/g, "") })
              }
            />
          </label>
          <label className="mt-4 block">
            <span className="mb-1.5 block text-sm font-semibold text-ink">Описание</span>
            <textarea
              className="field min-h-28 resize-y"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-3">
              <div className="flex items-start gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-50 text-ink/50">
                  <IconDoc />
                </span>
                <div>
                  <div className="text-sm font-semibold">Фотографии</div>
                  <div className="text-xs text-ink/45">Добавьте фотографии объекта (JPG, PNG)</div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative h-14 w-16 overflow-hidden rounded-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/media/${photo.id}`} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      className="absolute right-0.5 top-0.5 grid h-4 w-4 place-items-center rounded-full bg-white text-[10px]"
                      onClick={() => removePhoto(photo.id)}
                      aria-label="Убрать фото"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <label className="grid h-14 w-14 cursor-pointer place-items-center rounded-xl border border-dashed border-slate-300 text-xl text-slate-400">
                  +
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (file) upload(file, "gallery").catch((err) => setError(err.message));
                    }}
                  />
                </label>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 p-3">
              <div className="flex items-start gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-50 text-ink/50">
                  <IconDoc />
                </span>
                <div>
                  <div className="text-sm font-semibold">Планировка</div>
                  <div className="text-xs text-ink/45">Загрузите планировку (PDF, JPG, PNG)</div>
                </div>
              </div>
              {form.floorPlanId && floorMeta ? (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm">
                  <IconDoc className="text-brand-red" />
                  <span className="min-w-0 flex-1 truncate">
                    {floorMeta.name}
                    {floorMeta.size ? (
                      <span className="block text-xs text-ink/45">{formatBytes(floorMeta.size)}</span>
                    ) : null}
                  </span>
                  <button
                    type="button"
                    className="text-ink/40"
                    onClick={() => {
                      setForm((f) => ({ ...f, floorPlanId: null }));
                      setFloorMeta(null);
                    }}
                    aria-label="Убрать планировку"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <label className="mt-3 flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-300 px-3 py-4 text-sm text-ink/50">
                  Выбрать файл
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (file) upload(file, "floor").catch((err) => setError(err.message));
                    }}
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        <aside className="rounded-[28px] bg-white p-5 shadow-panel">
          <div className="text-lg font-bold text-ink">Предпросмотр на сайте</div>
          <p className="mt-1 text-sm text-ink/45">Так будет выглядеть карточка объекта</p>
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
            <div className="relative h-44 bg-slate-100">
              {previewImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/api/media/${previewImage}`} alt="" className="h-full w-full object-cover" />
              ) : (
                <InteriorShot seed={form.address || title} className="h-full w-full" />
              )}
              <span className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-rose-400">
                ♥
              </span>
            </div>
            <div className="p-4">
              <h2 className="text-xl font-bold leading-tight text-ink">{title}</h2>
              <p className="mt-1 text-sm text-ink/55">{form.address || "Адрес"}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                <span
                  className={`rounded-full px-2.5 py-1 ${
                    form.dealType === "sale"
                      ? "bg-rose-50 text-rose-600"
                      : "bg-sky-50 text-sky-700"
                  }`}
                >
                  {form.dealType === "sale" ? "Продажа" : "Аренда"}
                </span>
                {form.areaSqm && (
                  <span className="rounded-full bg-sky-50 px-2.5 py-1 text-sky-700">
                    {formatArea(form.areaSqm)}
                  </span>
                )}
              </div>
              <p className="mt-3 line-clamp-3 text-sm text-ink/70">{form.description}</p>
            </div>
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
            className="btn-primary w-full justify-between py-3.5 text-base"
            disabled={pending}
            onClick={() => save({ publish: true })}
          >
            <span>Опубликовать</span>
            <span aria-hidden>→</span>
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
      {propertyId && canPublish && (
        <button
          className="mt-3 text-sm font-semibold text-ink/50"
          disabled={pending}
          onClick={() =>
            start(async () => {
              await fetch(`/api/admin/properties/${propertyId}/unpublish`, { method: "POST" });
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

function plainNumber(value: string) {
  const n = Number(value);
  if (!value || Number.isNaN(n)) return "";
  return String(n);
}

function moneyLabel(digits: string, unit: "total" | "per_month") {
  const formatted = new Intl.NumberFormat("ru-RU").format(Number(digits) || 0);
  return unit === "per_month" ? `${formatted} ₽/мес` : `${formatted} ₽`;
}

function previewTitle(address: string, area: string) {
  if (address) return address;
  if (area) return `Помещение ${formatArea(area)}`;
  return "Новый объект";
}

function formatBytes(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} КБ`;
  return `${(size / (1024 * 1024)).toFixed(1).replace(".", ",")} МБ`;
}
