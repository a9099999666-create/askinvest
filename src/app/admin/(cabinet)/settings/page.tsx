import { listChannelStatus } from "@/lib/channels";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const channels = listChannelStatus();
  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Каналы</h1>
      <p className="mt-2 text-ink/70">
        Боевые Telegram / MAX / WhatsApp включаются через переменные окружения.
        Без credentials используется тестовый адаптер.
      </p>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {channels.map((c) => (
          <div key={c.kind} className="rounded-2xl bg-white/80 p-4">
            <div className="font-semibold uppercase">{c.kind}</div>
            <div className="mt-1 text-sm text-ink/70">
              {c.configured ? "Настроен" : "Нет credentials"} · режим {c.mode}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
