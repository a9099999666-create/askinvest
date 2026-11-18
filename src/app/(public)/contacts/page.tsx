import { DiscussForm } from "@/components/forms/DiscussForm";
import { getContactsHtml } from "@/lib/public/cache";

export const revalidate = 60;

export default async function ContactsPage() {
  const contactsHtml = await getContactsHtml();

  return (
    <div className="grid gap-8 pt-4 md:grid-cols-2">
      <div>
        <h1 className="font-display text-4xl font-bold text-ink">Контакты</h1>
        <div
          className="glass-panel prose prose-slate mt-6 max-w-none rounded-2xl p-6"
          dangerouslySetInnerHTML={{
            __html:
              contactsHtml ||
              "<p>Реквизиты и способы связи утвердит владелец.</p>",
          }}
        />
      </div>
      <DiscussForm sourcePage="/contacts" title="Общий вопрос" />
    </div>
  );
}
