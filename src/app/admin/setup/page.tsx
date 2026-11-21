"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/public/Logo";

export default function AdminSetupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("Владелец");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    start(async () => {
      const res = await fetch("/api/auth/setup-owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Не удалось создать владельца");
        return;
      }
      router.push("/admin/properties");
      router.refresh();
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-atmosphere px-4">
      <form
        onSubmit={onSubmit}
        className="glass-panel w-full max-w-md rounded-3xl p-8"
      >
        <Logo />
        <h1 className="mt-6 font-display text-2xl font-bold text-ink">
          Первая настройка
        </h1>
        <p className="mt-2 text-sm text-ink/70">
          Создайте учётную запись владельца. Страница доступна, только пока в
          системе нет пользователей.
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
        {error && <p className="field-error">{error}</p>}
        <button className="btn-primary mt-6 w-full" type="submit" disabled={pending}>
          {pending ? "Создаём…" : "Создать владельца"}
        </button>
      </form>
    </div>
  );
}
