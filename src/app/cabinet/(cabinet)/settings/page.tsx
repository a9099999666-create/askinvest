import { eq } from "drizzle-orm";
import { CompanyContacts } from "@/components/admin/CompanyContacts";
import { PageTitle } from "@/components/admin/PageTitle";
import { db } from "@/db/client";
import { siteSettings } from "@/db/schema";
import { listChannelStatus } from "@/lib/channels";
import { requirePageAccess } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

const channelLabel: Record<string, string> = {
  telegram: "Telegram",
  max: "MAX",
  whatsapp: "WhatsApp",
  test: "Тест",
};

export default async function SettingsPage() {
  const user = await requirePageAccess();
  const channels = listChannelStatus();
  const settings = await db.query.siteSettings.findFirst({
    where: eq(siteSettings.id, 1),
  });

  return (
    <div>
      <PageTitle
        title="Каналы и контакты"
        subtitle="Боевые Telegram / MAX / WhatsApp включаются через переменные окружения. Без credentials остаётся тестовый адаптер, кнопки на сайте на месте."
      />
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {channels.map((c) => (
          <div key={c.kind} className="cabinet-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="font-semibold text-ink">{channelLabel[c.kind] || c.kind}</div>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  c.configured
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-ink/50"
                }`}
              >
                {c.configured ? "Настроен" : "Нет ключа"}
              </span>
            </div>
            <div className="mt-2 text-sm text-ink/60">Режим {c.mode}</div>
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
