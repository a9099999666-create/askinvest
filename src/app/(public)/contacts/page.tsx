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
  const rows = [
    contacts.phone
      ? { label: "Телефон", value: contacts.phone, href: `tel:${contacts.phone.replace(/\s/g, "")}` }
      : null,
    contacts.address ? { label: "Адрес", value: contacts.address } : null,
    contacts.hours ? { label: "Часы работы", value: contacts.hours } : null,
  ].filter((row): row is { label: string; value: string; href?: string } => Boolean(row));
  const extraHtml =
    contacts.html && !/связь через форму/i.test(contacts.html) ? contacts.html : null;

  return (
    <div className="grid items-start gap-6 pt-2 md:grid-cols-2 md:gap-8">
      <div className="reveal flex flex-col">
        <h1 className="font-display text-5xl font-semibold leading-[0.95] text-ink md:text-6xl">
          Контакты
        </h1>
        <div className="accent-line mt-5" />
        <p className="mt-4 text-[15px] leading-relaxed text-ink/70">
          Напишите задачу — заявка попадёт в кабинет, и мы ответим удобным способом.
        </p>
        <div className="glass-panel mt-6 flex flex-col gap-4 rounded-[28px] p-5 md:p-6">
          {rows.map((row) => (
            <p key={row.label} className="min-h-[52px]">
              <span className="block text-sm leading-5 text-ink/45">{row.label}</span>
              {row.href ? (
                <a className="mt-1 block font-semibold leading-6 text-ink" href={row.href}>
                  {row.value}
                </a>
              ) : (
                <span className="mt-1 block font-semibold leading-6 text-ink">{row.value}</span>
              )}
            </p>
          ))}
          {extraHtml ? (
            <div
              className="prose prose-slate max-w-none text-sm"
              dangerouslySetInnerHTML={{ __html: extraHtml }}
            />
          ) : null}
          {rows.length === 0 && !extraHtml ? (
            <p className="text-[15px] leading-relaxed text-ink/70">
              АСКИНВЕСТ. Напишите задачу через форму — ответим в рабочие часы.
            </p>
          ) : null}
        </div>
      </div>
      <DiscussForm
        className="reveal reveal-delay-2"
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
