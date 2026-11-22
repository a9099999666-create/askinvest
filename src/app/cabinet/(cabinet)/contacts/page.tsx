import { desc } from "drizzle-orm";
import { PageTitle } from "@/components/admin/PageTitle";
import { db } from "@/db/client";
import { channelIdentities, contacts, subscriptions } from "@/db/schema";
import { requirePageAccess } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  await requirePageAccess("contacts");
  const rows = await db.select().from(contacts).orderBy(desc(contacts.createdAt));
  const identities = await db.select().from(channelIdentities);
  const subs = await db.select().from(subscriptions);

  return (
    <div>
      <PageTitle title="Контакты" subtitle="Люди, которые оставили заявку или написали в канал." />
      <ul className="mt-4 space-y-3 md:hidden">
        {rows.map((c) => (
          <li key={c.id} className="cabinet-card p-4">
            <div className="font-semibold text-ink">{c.displayName || "Без имени"}</div>
            <div className="mt-1 text-sm text-ink/60">{c.phone || "—"}</div>
            <div className="text-sm text-ink/60">{c.email || "—"}</div>
            <div className="mt-2 text-xs text-ink/45">
              Подписок: {subs.filter((s) => s.contactId === c.id && !s.revokedAt).length}
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4 hidden overflow-x-auto md:block">
        <div className="cabinet-card overflow-hidden">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="text-ink/45">
              <tr>
                <th className="px-5 py-4 font-medium">Имя</th>
                <th className="px-4 py-4 font-medium">Телефон</th>
                <th className="px-4 py-4 font-medium">Email</th>
                <th className="px-4 py-4 font-medium">Каналы</th>
                <th className="px-4 py-4 font-medium">Подписки</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-t border-slate-100">
                  <td className="px-5 py-3 font-semibold">{c.displayName || "Без имени"}</td>
                  <td className="px-4 py-3">{c.phone || "—"}</td>
                  <td className="px-4 py-3">{c.email || "—"}</td>
                  <td className="px-4 py-3 text-ink/70">
                    {identities
                      .filter((i) => i.contactId === c.id)
                      .map((i) => `${i.channel}:${i.externalId}`)
                      .join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {subs.filter((s) => s.contactId === c.id && !s.revokedAt).length}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 ? (
            <p className="px-5 py-8 text-ink/55">Пока нет контактов.</p>
          ) : null}
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="mt-6 text-center text-ink/55 md:hidden">Пока нет контактов.</p>
      ) : null}
    </div>
  );
}
