"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { MaterialItem } from "@/lib/content/materials";
import { PageTitle } from "./PageTitle";
import { IconBox, IconCase, IconCheck, IconDoc, IconPencil, IconSearch } from "./icons";

const statuses = [
  ["all", "Все"],
  ["published", "Опубликовано"],
  ["draft", "Черновик"],
  ["review", "На проверке"],
] as const;

export function ContentBoard({
  items,
  kind,
  canEdit = true,
}: {
  items: MaterialItem[];
  kind: "properties" | "services";
  canEdit?: boolean;
}) {
  const expected = kind === "services" ? "service" : "property";
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  const visible = useMemo(() => {
    const query = q.trim().toLowerCase();
    return items.filter((item) => {
      if (item.kind !== expected) return false;
      if (status !== "all" && item.status !== status) return false;
      if (!query) return true;
      return `${item.title} ${item.subtitle}`.toLowerCase().includes(query);
    });
  }, [items, expected, q, status]);

  const title = kind === "services" ? "Услуги" : "Объекты";
  const addHref = kind === "services" ? "/admin/services/new" : "/admin/properties/new";
  const addLabel = kind === "services" ? "+ Добавить услугу" : "+ Добавить объект";

  return (
    <div>
      <PageTitle title={title} />
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-2xl bg-white p-1 shadow-sm">
          <Link
            href="/admin/properties"
            className={`relative rounded-xl px-5 py-2 text-sm font-semibold ${
              kind === "properties" ? "text-ink" : "text-ink/45"
            }`}
          >
            Объекты
            {kind === "properties" ? (
              <span className="absolute inset-x-4 -bottom-1 h-[3px] rounded-full bg-brand-red" />
            ) : null}
          </Link>
          <Link
            href="/admin/services"
            className={`relative rounded-xl px-5 py-2 text-sm font-semibold ${
              kind === "services" ? "text-ink" : "text-ink/45"
            }`}
          >
            Услуги
            {kind === "services" ? (
              <span className="absolute inset-x-4 -bottom-1 h-[3px] rounded-full bg-brand-red" />
            ) : null}
          </Link>
        </div>
        {canEdit ? (
          <Link href={addHref} className="btn-primary px-4 py-2.5 text-sm">
            {addLabel}
          </Link>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1.4fr_0.8fr]">
        <label className="relative block">
          <IconSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="field pl-11"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск по названию..."
          />
        </label>
        <label className="field flex items-center gap-2">
          <span className="shrink-0 text-ink/70">Статус:</span>
          <select
            className="w-full bg-transparent font-semibold outline-none"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {statuses.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 overflow-hidden rounded-[28px] bg-white shadow-panel">
        <table className="w-full text-left text-sm">
          <thead className="text-ink/45">
            <tr>
              <th className="px-5 py-4 font-medium">Материал</th>
              <th className="hidden px-4 py-4 font-medium sm:table-cell">Тип</th>
              <th className="px-4 py-4 font-medium">Статус</th>
              <th className="w-16 px-4 py-4" />
            </tr>
          </thead>
          <tbody>
            {visible.map((item) => (
              <tr key={`${item.kind}-${item.id}`} className="border-t border-slate-100">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    {item.thumb ? (
                      <div className="h-12 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.thumb} alt="" className="h-full w-full object-cover" />
                      </div>
                    ) : null}
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-ink">{item.title}</div>
                      <div className="truncate text-xs text-ink/50">{item.subtitle}</div>
                    </div>
                  </div>
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-ink/70">
                    {item.kind === "property" ? <IconBox /> : <IconCase className="h-4 w-4" />}
                    {item.kind === "property" ? "Помещение" : "Услуга"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Status status={item.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  {canEdit ? (
                    <Link
                      href={item.href}
                      aria-label={`Изменить ${item.title}`}
                      className="inline-grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-ink/50 hover:bg-slate-50"
                    >
                      <IconPencil />
                    </Link>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 && (
          <p className="px-5 py-8 text-ink/55">Ничего не найдено.</p>
        )}
      </div>
    </div>
  );
}

function Status({ status }: { status: string }) {
  if (status === "published") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
        <IconCheck className="h-3.5 w-3.5" />
        Опубликовано
      </span>
    );
  }
  if (status === "review") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
        <IconDoc className="h-3.5 w-3.5" />
        На проверке
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
      <IconDoc className="h-3.5 w-3.5" />
      {status === "archived" ? "Архив" : "Черновик"}
    </span>
  );
}
