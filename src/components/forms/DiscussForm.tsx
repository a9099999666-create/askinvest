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
}: {
  serviceId?: string;
  propertyId?: string;
  intent?: string;
  sourcePage?: string;
  title?: string;
  variant?: "compact" | "full";
  channelStatus?: ChannelStatus[];
}) {
  const storageKey = `askinvest_pk_${intent}_${propertyId || serviceId || "site"}`;
  const compact = variant === "compact";
  const statusByKind = new Map(channelStatus.map((item) => [item.kind, item.configured]));
  const defaultChannel =
    channels.find((channel) => statusByKind.get(channel.id))?.id ?? channels[0].id;
  const unconfigured = channels.filter((channel) => statusByKind.get(channel.id) === false);

  return (
    <form
      className={
        compact
          ? "glass-panel rounded-[28px] p-5 md:p-6"
          : "glass-panel rounded-[28px] p-6 md:p-7"
      }
      action="/api/leads"
      method="post"
      data-storage-key={storageKey}
      data-compact={compact ? "1" : "0"}
    >
      <h2
        className={
          compact
            ? "font-display text-[26px] font-semibold leading-none text-ink md:text-[30px]"
            : "font-display text-[28px] font-bold leading-none text-ink"
        }
      >
        {title}
      </h2>
      <div className="mt-3 h-[3px] w-10 rounded bg-brand-red" />
      <p className="lead-notice mt-3 hidden text-sm" />
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

      <p className="mt-4 text-sm font-medium text-ink/70">Удобный способ связи</p>
      <div className="mt-2 flex gap-2">
        {channels.map((channel) => {
          const configured = statusByKind.get(channel.id);
          const known = statusByKind.has(channel.id);
          return (
            <label
              key={channel.id}
              className={`inline-flex min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-2xl border bg-white px-1 py-2 text-[11px] font-semibold leading-tight text-ink has-[:checked]:border-sky-300 has-[:checked]:bg-sky-50 has-[:checked]:shadow-sm sm:px-2 sm:py-2.5 sm:text-sm ${
                known && !configured
                  ? "border-dashed border-slate-300 text-ink/70"
                  : "border-slate-200"
              }`}
            >
              <input
                type="radio"
                name="channel"
                value={channel.id}
                defaultChecked={channel.id === defaultChannel}
                data-configured={configured ? "1" : "0"}
                data-label={channel.label}
                className="sr-only"
              />
              <span className="inline-flex max-w-full items-center gap-1 sm:gap-1.5">
                {channel.icon}
                <span className="truncate">{channel.label}</span>
              </span>
              {known && !configured ? (
                <span className="text-[10px] font-medium leading-none text-ink/45 sm:text-[11px]">
                  не подключён
                </span>
              ) : null}
            </label>
          );
        })}
      </div>
      {compact && unconfigured.length > 0 ? (
        <p className="mt-2 text-xs leading-snug text-ink/50">
          {unconfigured.length === channels.length
            ? "Мессенджеры пока не подключены — заявка сохранится на сайте, мы ответим вам."
            : `${unconfigured.map((item) => item.label).join(", ")} пока не подключены. Заявка всё равно сохранится.`}
        </p>
      ) : null}

      <button
        className={
          compact
            ? "btn-primary mt-4 w-full justify-between rounded-2xl px-5 py-3 text-base"
            : "btn-primary mt-5 w-full justify-between rounded-2xl px-5 py-3.5 text-base"
        }
        type="submit"
      >
        <span data-submit-label>{compact ? "Оставить заявку" : "Отправить заявку"}</span>
        <span aria-hidden className="text-xl">
          →
        </span>
      </button>
    </form>
  );
}

