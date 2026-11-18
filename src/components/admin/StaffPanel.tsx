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

export function StaffPanel({ staff }: { staff: Staff[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [perms, setPerms] = useState({
    editContent: true,
    publish: false,
    leads: true,
    contacts: true,
    campaigns: false,
  });
  const [pending, start] = useTransition();

  function invite() {
    start(async () => {
      const res = await fetch("/api/admin/staff/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password, permissions: perms }),
      });
      const data = await res.json();
      if (data.inviteToken) {
        setInviteUrl(`${window.location.origin}/admin/login?invite=${data.inviteToken}`);
      }
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

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white/80 p-5">
        <h2 className="font-semibold">Пригласить сотрудника</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <input className="field" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="field" placeholder="Имя" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="field" placeholder="Временный пароль" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          {(Object.keys(perms) as (keyof typeof perms)[]).map((k) => (
            <label key={k} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={perms[k]}
                onChange={(e) => setPerms({ ...perms, [k]: e.target.checked })}
              />
              {k}
            </label>
          ))}
        </div>
        <button className="btn-primary mt-3" disabled={pending} onClick={invite}>
          Создать доступ
        </button>
        {inviteUrl && (
          <p className="mt-2 break-all text-xs text-ink/60">
            Одноразовое приглашение (для журнала): {inviteUrl}
          </p>
        )}
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
                  disabled={pending}
                  onClick={() => toggle(s.id, !s.isActive)}
                >
                  {s.isActive ? "Отключить" : "Включить"}
                </button>
              )}
            </div>
            {!s.isOwner && (
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
                      {k}
                    </label>
                  ),
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
