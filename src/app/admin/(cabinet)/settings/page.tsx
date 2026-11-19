import { eq } from "drizzle-orm";
import { CompanyContacts } from "@/components/admin/CompanyContacts";
import { db } from "@/db/client";
import { siteSettings } from "@/db/schema";
import { listChannelStatus } from "@/lib/channels";
import { requirePageAccess } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requirePageAccess();
  const channels = listChannelStatus();
  const settings = await db.query.siteSettings.findFirst({
    where: eq(siteSettings.id, 1),
  });

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Каналы и контакты</h1>
      <p className="mt-2 text-ink/70">
        Боевые Telegram / MAX / WhatsApp включаются через переменные окружения.
        Без credentials используется тестовый адаптер, но кнопки каналов на сайте остаются.
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
      {user.isOwner ? (
        <CompanyContacts
          initial={{
            contactPhone: settings?.contactPhone || "",
            contactAddress: settings?.contactAddress || "",
            contactHours: settings?.contactHours || "",
            contactsHtml: settings?.contactsHtml || "",
          }}
        />
      ) : null}
    </div>
  );
}
