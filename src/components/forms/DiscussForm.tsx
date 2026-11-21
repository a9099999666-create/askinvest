import { DiscussFormBoot } from "@/components/forms/DiscussFormBoot";
import { MaxIcon, TelegramIcon, WhatsIcon } from "@/components/icons/channels";
import type { ChannelKind } from "@/lib/channels";
import { cn } from "@/lib/utils";

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
  className,
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
  className?: string;
}) {
  const storageKey = `askinvest_pk_${intent}_${propertyId || serviceId || sourcePage || "site"}`;
  const compact = variant === "compact";
  const statusByKind = new Map(channelStatus.map((item) => [item.kind, item.configured]));
  const defaultChannel =
    channels.find((channel) => statusByKind.get(channel.id))?.id || channels[0].id;
  const submitLabel = compact ? actionLabel || "Обсудить задачу" : actionLabel || "Отправить заявку";
  const panelClass = cn(
    "form-panel glass-panel flex flex-col gap-4 rounded-[28px]",
    compact ? "p-5 md:p-6" : "p-6 md:p-7",
    className,
  );
  const titleClass = compact
    ? "font-display text-[22px] font-semibold leading-none text-ink sm:text-[26px] md:text-[30px]"
    : "font-display text-[24px] font-bold leading-none text-ink sm:text-[28px]";

  if (notice === "ok") {
    return (
      <div className={panelClass}>
        <div>
          <h2 className={titleClass}>Заявка принята</h2>
          <div className="accent-line mt-3 !w-10" />
        </div>
        <p className="lead-notice text-sm text-emerald-300">
          Мы получили вопрос и ответим в рабочие часы.
        </p>
      </div>
    );
  }

  const anyChannelLive = channels.some((channel) => statusByKind.get(channel.id));
  const showReply = compact;

  return (
    <form
      className={panelClass}
      action="/api/leads"
      method="post"
      data-storage-key={storageKey}
      data-compact={compact ? "1" : "0"}
    >
      <div>
        <h2 className={titleClass}>{title}</h2>
        <div className="accent-line mt-3 !w-10" />
      </div>
      {notice === "error" ? (
        <p className="lead-notice text-sm text-brand-red">
          {compact
            ? "Укажите телефон или email, чтобы мы ответили."
            : "Не удалось сохранить. Проверьте поля и нажмите ещё раз."}
        </p>
      ) : (
        <p className="lead-notice hidden text-sm" />
      )}
      <div className="hidden">
        <input type="hidden" name="publicKey" defaultValue="" />
        <DiscussFormBoot storageKey={storageKey} compact={compact} askReply={showReply} />
        <input type="hidden" name="sourcePage" value={sourcePage || "/"} />
        <input type="hidden" name="intent" value={intent} />
        {serviceId ? <input type="hidden" name="serviceId" value={serviceId} /> : null}
        {propertyId ? <input type="hidden" name="propertyId" value={propertyId} /> : null}
      </div>

      {!compact ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm text-ink/70">ФИО</span>
              <input
                className="field"
                name="visitorName"
                autoComplete="name"
                required
                placeholder="Иван Иванов"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm text-ink/70">Телефон</span>
              <input
                className="field"
                name="visitorPhone"
                type="tel"
                autoComplete="tel"
                required
                placeholder="+7 900 000-00-00"
              />
            </label>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-sm text-ink/70">Email</span>
            <input
              className="field"
              name="visitorEmail"
              type="email"
              autoComplete="email"
              placeholder="необязательно"
            />
          </label>
        </>
      ) : null}

      <label className="block">
        {!compact ? <span className="mb-1.5 block text-sm text-ink/70">Задача</span> : null}
        <textarea
          className={
            compact
              ? "field min-h-[88px] resize-y md:min-h-[96px]"
              : "field min-h-[108px] resize-y"
          }
          name="question"
          placeholder="Чем можем помочь?"
          required
        />
      </label>

      <div className="grid grid-cols-3 gap-2">
        {channels.map((channel) => (
          <label
            key={channel.id}
            aria-label={channel.label}
            className="channel-chip inline-flex min-h-11 min-w-0 items-center justify-center gap-1 rounded-2xl px-1 py-2.5 text-[11px] font-semibold text-[#10233a] min-[380px]:gap-1.5 min-[380px]:px-1.5 min-[380px]:text-[12px] sm:px-2 sm:text-sm"
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
            <span className="hidden truncate min-[380px]:inline">{channel.label}</span>
          </label>
        ))}
      </div>

      {compact ? (
        <label className="block" data-reply-wrap>
          <input
            className="field"
            name="replyTo"
            autoComplete="tel"
            placeholder="Телефон или email для ответа"
            aria-label="Телефон или email для ответа"
            required={showReply && !anyChannelLive}
          />
        </label>
      ) : null}

      <button
        className="btn-primary mt-auto flex w-full !justify-between rounded-2xl px-5 py-3 text-base"
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
