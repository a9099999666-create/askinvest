"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/public/Logo";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    start(async () => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ошибка входа");
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
          Вход в кабинет
        </h1>
        <div className="mt-3 h-[3px] w-10 rounded-full bg-gradient-to-r from-brand-cyan to-brand-red" />
        <label className="mt-6 block">
          <span className="mb-1.5 block text-sm text-ink/70">Email</span>
          <input
            className="field"
            type="email"
            name="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="mt-3 block">
          <span className="mb-1.5 block text-sm text-ink/70">Пароль</span>
          <input
            className="field"
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p className="field-error">{error}</p>}
        <button className="btn-primary mt-6 w-full !justify-between" type="submit" disabled={pending}>
          <span>{pending ? "Входим…" : "Войти"}</span>
          <span aria-hidden>→</span>
        </button>
      </form>
    </div>
  );
}
