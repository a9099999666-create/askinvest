"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/public/Logo";

export function AdminSetupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("Владелец");
  const [password, setPassword] = useState("");
  const [setupToken, setSetupToken] = useState("");
  const [tokenSetup, setTokenSetup] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  useEffect(() => {
    fetch("/api/auth/setup-status")
      .then((res) => res.json())
      .then((data) => {
        if (data.tokenSetup) setTokenSetup(true);
      })
      .catch(() => undefined);
  }, []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    start(async () => {
      const res = await fetch("/api/auth/setup-owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password, setupToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Не удалось создать владельца");
        return;
      }
      router.push("/cabinet/properties");
      router.refresh();
    });
  }

  return (
    <div className="cabinet-shell flex min-h-dvh items-center justify-center px-4 py-10">
      <form
        onSubmit={onSubmit}
        className="cabinet-card w-full max-w-md p-6 sm:p-8"
      >
        <Logo />
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/40">
          Закрытый кабинет
        </p>
        <h1 className="mt-2 font-display text-[clamp(1.7rem,5vw,2.1rem)] font-bold leading-none text-ink">
          Первая настройка
        </h1>
        <div className="mt-3 h-[3px] w-10 rounded-full bg-gradient-to-r from-brand-cyan to-brand-red" />
        <p className="mt-4 text-sm leading-relaxed text-ink/70">
          Создайте учётную запись владельца. Это может сделать только
          администратор приложения, и только пока в системе нет пользователей.
        </p>
        <label className="mt-5 block">
          <span className="mb-1 block text-sm text-ink/70">Email</span>
          <input
            className="field"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="mt-3 block">
          <span className="mb-1 block text-sm text-ink/70">Имя</span>
          <input
            className="field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label className="mt-3 block">
          <span className="mb-1 block text-sm text-ink/70">
            Пароль (от 12 символов)
          </span>
          <input
            className="field"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={12}
          />
        </label>
        {tokenSetup ? (
          <label className="mt-3 block">
            <span className="mb-1 block text-sm text-ink/70">Код настройки</span>
            <input
              className="field"
              type="password"
              autoComplete="off"
              value={setupToken}
              onChange={(e) => setSetupToken(e.target.value)}
              required
            />
          </label>
        ) : null}
        {error && <p className="field-error">{error}</p>}
        <button className="btn-primary mt-6 w-full !justify-between" type="submit" disabled={pending}>
          <span>{pending ? "Создаём…" : "Создать владельца"}</span>
          <span aria-hidden>→</span>
        </button>
      </form>
    </div>
  );
}
