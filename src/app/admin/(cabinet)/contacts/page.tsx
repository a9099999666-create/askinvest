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
      <PageTitle title="Контакты" />
      <div className="mt-4 overflow-hidden rounded-[28px] bg-white shadow-panel">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-ink/60">
            <tr>
              <th className="px-4 py-3">Имя</th>
              <th className="px-4 py-3">Телефон</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Каналы</th>
              <th className="px-4 py-3">Подписки</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{c.displayName || "Без имени"}</td>
                <td className="px-4 py-3">{c.phone || "—"}</td>
                <td className="px-4 py-3">{c.email || "—"}</td>
                <td className="px-4 py-3">
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
      </div>
    </div>
  );
}
