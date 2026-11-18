"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function PropertyEditor({
  propertyId,
  initial,
  canPublish,
}: {
  propertyId?: string;
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
    updatedAt: string;
  };
  canPublish: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: initial?.title || "",
    address: initial?.address || "",
    dealType: initial?.dealType || ("rent" as "sale" | "rent"),
    areaSqm: initial?.areaSqm || "",
    priceRub: initial?.priceRub || "",
    priceUnit: initial?.priceUnit || ("per_month" as "total" | "per_month"),
    description: initial?.description || "",
    coverId: initial?.coverId || null,
    galleryIds: initial?.galleryIds || ([] as string[]),
    floorPlanId: initial?.floorPlanId || null,
  });
  const [updatedAt, setUpdatedAt] = useState(initial?.updatedAt || "");
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState("");
  const [pending, start] = useTransition();

  async function upload(file: File, kind: "cover" | "gallery" | "floor") {
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/admin/media", { method: "POST", body });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Ошибка загрузки");
    if (kind === "cover") setForm((f) => ({ ...f, coverId: data.id }));
    if (kind === "floor") setForm((f) => ({ ...f, floorPlanId: data.id }));
    if (kind === "gallery")
      setForm((f) => ({ ...f, galleryIds: [...f.galleryIds, data.id] }));
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
        body: JSON.stringify({ ...form, expectedUpdatedAt: updatedAt, status: extra?.status }),
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

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-3 rounded-2xl bg-white/80 p-5">
        <label className="block">
          <span className="mb-1 block text-sm">Название</span>
          <input className="field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm">Адрес</span>
          <input className="field" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="mb-1 block text-sm">Сделка</span>
            <select className="field" value={form.dealType} onChange={(e) => setForm({ ...form, dealType: e.target.value as "sale" | "rent" })}>
              <option value="sale">Продажа</option>
              <option value="rent">Аренда</option>
            </select>
          </label>
          <label>
            <span className="mb-1 block text-sm">Площадь, м²</span>
            <input className="field" value={form.areaSqm} onChange={(e) => setForm({ ...form, areaSqm: e.target.value })} />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="mb-1 block text-sm">Цена, ₽</span>
            <input className="field" value={form.priceRub} onChange={(e) => setForm({ ...form, priceRub: e.target.value })} />
          </label>
          <label>
            <span className="mb-1 block text-sm">Единица</span>
            <select className="field" value={form.priceUnit} onChange={(e) => setForm({ ...form, priceUnit: e.target.value as "total" | "per_month" })}>
              <option value="total">За объект</option>
              <option value="per_month">В месяц</option>
            </select>
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block text-sm">Описание</span>
          <textarea className="field min-h-28" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </label>
        <div className="space-y-2">
          <label className="block text-sm">
            Обложка
            <input type="file" accept="image/*" className="mt-1 block w-full text-sm" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "cover").catch((err) => setError(err.message))} />
          </label>
          <label className="block text-sm">
            Фото в галерею
            <input type="file" accept="image/*" className="mt-1 block w-full text-sm" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "gallery").catch((err) => setError(err.message))} />
          </label>
          <label className="block text-sm">
            Планировка (PDF/изображение)
            <input type="file" accept="image/*,application/pdf" className="mt-1 block w-full text-sm" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "floor").catch((err) => setError(err.message))} />
          </label>
          <p className="text-xs text-ink/50">
            Галерея: {form.galleryIds.length} файл(ов)
            {form.coverId ? " · обложка загружена" : ""}
            {form.floorPlanId ? " · планировка загружена" : ""}
          </p>
        </div>
        {error && <p className="field-error">{error}</p>}
        {conflict && <pre className="max-h-40 overflow-auto rounded bg-amber-50 p-3 text-xs">{conflict}</pre>}
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary" disabled={pending} onClick={() => save({ status: "draft" })}>Сохранить черновик</button>
          {!canPublish && (
            <button className="btn-ghost" disabled={pending} onClick={() => save({ status: "review" })}>Отправить на проверку</button>
          )}
          {canPublish && (
            <button className="btn-primary" disabled={pending} onClick={() => save({ publish: true })}>Опубликовать</button>
          )}
          {propertyId && canPublish && (
            <button
              className="btn-ghost"
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
      </div>
      <div className="rounded-2xl bg-white/80 p-5">
        <div className="text-sm text-ink/50">Предпросмотр</div>
        <h2 className="mt-2 text-2xl font-bold">{form.title || "Объект"}</h2>
        <p className="text-ink/70">{form.address}</p>
        <p className="mt-2">{form.areaSqm} м² · {form.priceRub} ₽ {form.priceUnit === "per_month" ? "/мес" : ""}</p>
        <p className="mt-4 whitespace-pre-wrap text-sm">{form.description}</p>
        {form.coverId && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/api/media/${form.coverId}`} alt="" className="mt-4 max-h-48 rounded-xl object-cover" />
        )}
      </div>
    </div>
  );
}
