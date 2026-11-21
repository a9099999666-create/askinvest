"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Staff = {
  id: string;
  email: string;
  name: string;
  isOwner: boolean;
  isActive: boolean;
  permissions: {
    editContent: boolean;
    publish: boolean;
    leads: boolean;
    contacts: boolean;
    campaigns: boolean;
  };
};

const permLabel: Record<keyof Staff["permissions"], string> = {
  editContent: "Контент",
  publish: "Публикация",
  leads: "Заявки",
  contacts: "Контакты",
  campaigns: "Рассылки",
};

export function StaffPanel({ staff }: { staff: Staff[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [created, setCreated] = useState<{ login: string; password: string } | null>(
    null,
  );
  const [resetId, setResetId] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [error, setError] = useState("");
  const [perms, setPerms] = useState({
    editContent: true,
    publish: false,
    leads: true,
    contacts: true,
    campaigns: false,
  });
  const [pending, start] = useTransition();

  function invite() {
    setError("");
    setCreated(null);
    if (password.trim().length < 8) {
      setError("Пароль сотрудника не короче 8 символов");
      return;
    }
    start(async () => {
      const res = await fetch("/api/admin/staff/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password, permissions: perms }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Не удалось создать сотрудника");
        return;
      }
      setCreated({ login: data.login, password: data.temporaryPassword });
      setEmail("");
      setName("");
      setPassword("");
      router.refresh();
    });
  }

  function toggle(id: string, isActive: boolean) {
    start(async () => {
      await fetch(`/api/admin/staff/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      router.refresh();
    });
  }

  function updatePerms(id: string, permissions: Staff["permissions"]) {
    start(async () => {
      await fetch(`/api/admin/staff/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions }),
      });
      router.refresh();
    });
  }

  function resetStaffPassword(id: string) {
    setError("");
    start(async () => {
      const res = await fetch(`/api/admin/staff/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: resetPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Не удалось обновить пароль");
        return;
      }
      const row = staff.find((item) => item.id === id);
      setCreated({ login: row?.email || "", password: resetPassword });
      setResetId("");
      setResetPassword("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white/80 p-5">
        <h2 className="font-semibold">Добавить сотрудника</h2>
        <p className="mt-1 text-sm text-ink/60">
          Сотрудник входит в кабинет по email и паролю на странице /cabinet/login.
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <input
            className="field"
            type="email"
            placeholder="Email — логин"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="field"
            placeholder="Имя"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="field md:col-span-2"
            type="text"
            placeholder="Пароль для входа (от 8 символов)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          {(Object.keys(perms) as (keyof typeof perms)[]).map((k) => (
            <label key={k} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={perms[k]}
                onChange={(e) => setPerms({ ...perms, [k]: e.target.checked })}
              />
              {permLabel[k]}
            </label>
          ))}
        </div>
        <button className="btn-primary mt-3" type="button" disabled={pending} onClick={invite}>
          Создать доступ
        </button>
        {error ? <p className="field-error">{error}</p> : null}
        {created ? (
          <div className="mt-3 rounded-2xl bg-emerald-50 p-3 text-sm text-ink">
            <p className="font-semibold">Данные для входа</p>
            <p className="mt-1">Логин: {created.login}</p>
            <p>Пароль: {created.password}</p>
            <p className="mt-1 text-ink/60">Вход: /cabinet/login</p>
          </div>
        ) : null}
      </div>

      <div className="space-y-3">
        {staff.map((s) => (
          <div key={s.id} className="rounded-2xl bg-white/80 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-semibold">
                  {s.name} · {s.email}
                </div>
                <div className="text-sm text-ink/60">
                  {s.isOwner ? "Владелец" : s.isActive ? "Активен" : "Отключён"}
                </div>
              </div>
              {!s.isOwner && (
                <button
                  className="btn-ghost"
                  type="button"
                  disabled={pending}
                  onClick={() => toggle(s.id, !s.isActive)}
                >
                  {s.isActive ? "Отключить" : "Включить"}
                </button>
              )}
            </div>
            {!s.isOwner && (
              <>
                <div className="mt-3 flex flex-wrap gap-3 text-sm">
                  {(Object.keys(s.permissions) as (keyof Staff["permissions"])[]).map(
                    (k) => (
                      <label key={k} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={s.permissions[k]}
                          onChange={(e) =>
                            updatePerms(s.id, {
                              ...s.permissions,
                              [k]: e.target.checked,
                            })
                          }
                        />
                        {permLabel[k]}
                      </label>
                    ),
                  )}
                </div>
                {resetId === s.id ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <input
                      className="field max-w-xs"
                      placeholder="Новый пароль"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                    />
                    <button
                      className="btn-primary"
                      type="button"
                      disabled={pending}
                      onClick={() => resetStaffPassword(s.id)}
                    >
                      Сохранить пароль
                    </button>
                  </div>
                ) : (
                  <button
                    className="btn-ghost mt-3"
                    type="button"
                    onClick={() => {
                      setResetId(s.id);
                      setResetPassword("");
                    }}
                  >
                    Выдать новый пароль
                  </button>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
