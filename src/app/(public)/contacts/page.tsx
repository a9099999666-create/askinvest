import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { siteSettings } from "@/db/schema";
import { DiscussForm } from "@/components/forms/DiscussForm";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const settings = await db.query.siteSettings.findFirst({
    where: eq(siteSettings.id, 1),
  });

  return (
    <div className="grid gap-8 pt-4 md:grid-cols-2">
      <div>
        <h1 className="font-display text-4xl font-bold text-ink">Контакты</h1>
        <div
          className="glass-panel prose prose-slate mt-6 max-w-none rounded-2xl p-6"
          dangerouslySetInnerHTML={{
            __html:
              settings?.contactsHtml ||
              "<p>Реквизиты и способы связи утвердит владелец.</p>",
          }}
        />
      </div>
      <DiscussForm sourcePage="/contacts" title="Общий вопрос" />
    </div>
  );
}
