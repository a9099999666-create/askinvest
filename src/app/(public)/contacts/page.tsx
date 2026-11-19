import { DiscussForm } from "@/components/forms/DiscussForm";
import { listPublicChannelStatus } from "@/lib/channels";
import { getPublicContacts } from "@/lib/public/cache";

export const revalidate = 60;

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ lead?: string }>;
}) {
  const contacts = await getPublicContacts();
  const params = await searchParams;
  const notice = params.lead === "ok" || params.lead === "error" ? params.lead : undefined;
  const channelStatus = listPublicChannelStatus();

  return (
    <div className="grid items-start gap-8 pt-2 md:grid-cols-2">
      <div>
        <h1 className="font-display text-5xl font-bold leading-[0.95] text-ink md:text-6xl">
          Контакты
        </h1>
        <div className="mt-5 h-[3px] w-16 rounded-full bg-[#ff3142]" />
        <p className="mt-4 text-ink/70">
          Напишите задачу — заявка попадёт в кабинет, и мы ответим удобным способом.
        </p>
        <div className="glass-panel mt-6 space-y-3 rounded-[28px] p-6 text-ink/80">
          {contacts.phone ? (
            <p>
              <span className="block text-sm text-ink/45">Телефон</span>
              <a className="font-semibold text-ink" href={`tel:${contacts.phone.replace(/\s/g, "")}`}>
                {contacts.phone}
              </a>
            </p>
          ) : null}
          {contacts.address ? (
            <p>
              <span className="block text-sm text-ink/45">Адрес</span>
              <span className="font-semibold text-ink">{contacts.address}</span>
            </p>
          ) : null}
          {contacts.hours ? (
            <p>
              <span className="block text-sm text-ink/45">Часы работы</span>
              <span className="font-semibold text-ink">{contacts.hours}</span>
            </p>
          ) : null}
          {contacts.html ? (
            <div
              className="prose prose-slate max-w-none pt-2 text-sm"
              dangerouslySetInnerHTML={{ __html: contacts.html }}
            />
          ) : !contacts.phone && !contacts.address ? (
            <p>АСКИНВЕСТ. Связь через форму на сайте.</p>
          ) : null}
        </div>
      </div>
      <DiscussForm
        sourcePage="/contacts"
        title="Обсудить задачу"
        variant="compact"
        channelStatus={channelStatus}
        notice={notice}
        actionLabel="Обсудить задачу"
      />
    </div>
  );
}
