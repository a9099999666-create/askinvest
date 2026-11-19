"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/public/Logo";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  useEffect(() => {
    fetch("/api/auth/setup-status")
      .then((r) => r.json())
      .then((data) => {
        if (data.needsSetup) router.replace("/admin/setup");
      })
      .catch(() => undefined);
  }, [router]);

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
      router.push("/admin");
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
          Вход в кабинет
        </h1>
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
          <span className="mb-1 block text-sm text-ink/70">Пароль</span>
          <input
            className="field"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p className="field-error">{error}</p>}
        <button className="btn-primary mt-6 w-full" disabled={pending}>
          {pending ? "Входим…" : "Войти"}
        </button>
      </form>
    </div>
  );
}
