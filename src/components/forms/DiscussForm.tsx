import { DiscussFormBoot } from "@/components/forms/DiscussFormBoot";
import { MaxIcon, TelegramIcon, WhatsIcon } from "@/components/icons/channels";
import type { ChannelKind } from "@/lib/channels";

const channels: { id: ChannelKind; label: string; icon: React.ReactNode }[] = [
  { id: "telegram", label: "Telegram", icon: <TelegramIcon className="h-4 w-4 shrink-0" /> },
  { id: "max", label: "MAX", icon: <MaxIcon className="h-4 w-4 shrink-0" /> },
  { id: "whatsapp", label: "WhatsApp", icon: <WhatsIcon className="h-4 w-4 shrink-0" /> },
];

type ChannelStatus = { kind: ChannelKind; configured: boolean };

export function DiscussForm({
  serviceId,
  propertyId,
  intent = "discuss",
  sourcePage,
  title = "Обсудить задачу",
  variant = "full",
  channelStatus = [],
  notice,
  actionLabel,
}: {
  serviceId?: string;
  propertyId?: string;
  intent?: string;
  sourcePage?: string;
  title?: string;
  variant?: "compact" | "full";
  channelStatus?: ChannelStatus[];
  notice?: "ok" | "error";
  actionLabel?: string;
}) {
  const storageKey = `askinvest_pk_${intent}_${propertyId || serviceId || "site"}`;
  const compact = variant === "compact";
  const statusByKind = new Map(channelStatus.map((item) => [item.kind, item.configured]));
  const defaultChannel =
    channels.find((channel) => statusByKind.get(channel.id))?.id || channels[0].id;
  const submitLabel = compact ? actionLabel || "Обсудить задачу" : actionLabel || "Отправить заявку";
  const panelClass = compact
    ? "glass-panel rounded-[28px] p-5 md:p-6"
    : "glass-panel rounded-[28px] p-6 md:p-7";
  const titleClass = compact
    ? "font-display text-[26px] font-semibold leading-none text-ink md:text-[30px]"
    : "font-display text-[28px] font-bold leading-none text-ink";

  if (notice === "ok") {
    return (
      <div className={panelClass}>
        <h2 className={titleClass}>Заявка принята</h2>
        <div className="mt-3 h-[3px] w-10 rounded bg-brand-red" />
        <p className="lead-notice mt-4 text-sm text-emerald-700">
          Мы получили вопрос и ответим в рабочие часы.
        </p>
      </div>
    );
  }

  return (
    <form
      className={panelClass}
      action="/api/leads"
      method="post"
      data-storage-key={storageKey}
      data-compact={compact ? "1" : "0"}
    >
      <h2 className={titleClass}>{title}</h2>
      <div className="mt-3 h-[3px] w-10 rounded bg-brand-red" />
      {notice === "error" ? (
        <p className="lead-notice mt-3 text-sm text-brand-red">
          Не удалось сохранить. Проверьте поля и нажмите ещё раз.
        </p>
      ) : (
        <p className="lead-notice mt-3 hidden text-sm" />
      )}
      <input type="hidden" name="publicKey" defaultValue="" />
      <DiscussFormBoot storageKey={storageKey} compact={compact} />
      <input type="hidden" name="sourcePage" value={sourcePage || "/"} />
      <input type="hidden" name="intent" value={intent} />
      {serviceId ? <input type="hidden" name="serviceId" value={serviceId} /> : null}
      {propertyId ? <input type="hidden" name="propertyId" value={propertyId} /> : null}

      {!compact ? (
        <>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm text-ink/70">ФИО</span>
              <input
                className="field bg-white"
                name="visitorName"
                autoComplete="name"
                required
                placeholder="Иван Иванов"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-ink/70">Телефон</span>
              <input
                className="field bg-white"
                name="visitorPhone"
                type="tel"
                autoComplete="tel"
                required
                placeholder="+7 900 000-00-00"
              />
            </label>
          </div>
          <label className="mt-3 block">
            <span className="mb-1 block text-sm text-ink/70">Email</span>
            <input
              className="field bg-white"
              name="visitorEmail"
              type="email"
              autoComplete="email"
              placeholder="необязательно"
            />
          </label>
        </>
      ) : null}

      <label className={compact ? "mt-4 block" : "mt-3 block"}>
        {!compact ? <span className="mb-1 block text-sm text-ink/70">Задача</span> : null}
        <textarea
          className={
            compact
              ? "field min-h-[88px] resize-y bg-white md:min-h-[96px]"
              : "field min-h-[108px] resize-y bg-white"
          }
          name="question"
          placeholder="Чем можем помочь?"
          required
        />
      </label>

      <div className="mt-4 flex gap-2">
        {channels.map((channel) => (
          <label
            key={channel.id}
            className="inline-flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-2 py-2.5 text-[12px] font-semibold text-ink has-[:checked]:border-sky-300 has-[:checked]:bg-sky-50 sm:text-sm"
          >
            <input
              type="radio"
              name="channel"
              value={channel.id}
              defaultChecked={channel.id === defaultChannel}
              data-configured={statusByKind.get(channel.id) ? "1" : "0"}
              data-label={channel.label}
              className="sr-only"
            />
            {channel.icon}
            <span className="truncate">{channel.label}</span>
          </label>
        ))}
      </div>

      {compact ? (
        <label className="mt-2 hidden" data-reply-wrap>
          <input
            className="field bg-white"
            name="replyTo"
            autoComplete="tel"
            placeholder="Телефон или email для ответа"
            aria-label="Телефон или email для ответа"
          />
        </label>
      ) : null}

      <button
        className={
          compact
            ? "btn-primary mt-4 w-full justify-between rounded-2xl px-5 py-3 text-base"
            : "btn-primary mt-5 w-full justify-between rounded-2xl px-5 py-3.5 text-base"
        }
        type="submit"
      >
        <span data-submit-label>{submitLabel}</span>
        <span aria-hidden className="text-xl">
          →
        </span>
      </button>
    </form>
  );
}
