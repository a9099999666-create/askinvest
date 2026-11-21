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
    <div className="flex min-h-dvh items-center justify-center bg-atmosphere px-4 py-8">
      <form
        onSubmit={onSubmit}
        className="glass-panel w-full max-w-md rounded-3xl p-5 sm:p-8"
      >
        <Logo />
        <h1 className="mt-6 font-display text-2xl font-bold text-ink">
          Первая настройка
        </h1>
        <p className="mt-2 text-sm text-ink/70">
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
        <button className="btn-primary mt-6 w-full" type="submit" disabled={pending}>
          {pending ? "Создаём…" : "Создать владельца"}
        </button>
      </form>
    </div>
  );
}
