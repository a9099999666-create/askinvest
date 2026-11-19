import { DiscussForm } from "@/components/forms/DiscussForm";
import { listPublicChannelStatus } from "@/lib/channels";
import { getContactsHtml } from "@/lib/public/cache";

export const revalidate = 60;

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ lead?: string }>;
}) {
  const contactsHtml = await getContactsHtml();
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
        <div
          className="glass-panel prose prose-slate mt-6 max-w-none rounded-[28px] p-6"
          dangerouslySetInnerHTML={{
            __html:
              contactsHtml ||
              "<p>АСКИНВЕСТ. Связь через форму на сайте.</p>",
          }}
        />
      </div>
      <DiscussForm
        sourcePage="/contacts"
        title="Обсудить задачу"
        variant="compact"
        channelStatus={channelStatus}
        notice={notice}
        actionLabel="Обсудить задачу"
        prompts={["Нужна консультация", "Вопрос по договору", "Подобрать помещение"]}
      />
    </div>
  );
}
