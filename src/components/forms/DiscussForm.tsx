import { MaxIcon, TelegramIcon, WhatsIcon } from "@/components/icons/channels";
import type { ChannelKind } from "@/lib/channels";

const channels: { id: ChannelKind; label: string; icon: React.ReactNode }[] = [
  { id: "telegram", label: "Telegram", icon: <TelegramIcon className="h-5 w-5" /> },
  { id: "max", label: "MAX", icon: <MaxIcon className="h-5 w-5" /> },
  { id: "whatsapp", label: "WhatsApp", icon: <WhatsIcon className="h-5 w-5" /> },
];

export function DiscussForm({
  serviceId,
  propertyId,
  intent = "discuss",
  sourcePage,
  title = "Обсудить задачу",
}: {
  serviceId?: string;
  propertyId?: string;
  intent?: string;
  sourcePage?: string;
  title?: string;
}) {
  const storageKey = `askinvest_pk_${intent}_${propertyId || serviceId || "site"}`;
  return (
    <form
      className="glass-panel rounded-[28px] p-6 md:p-7"
      action="/api/leads"
      method="post"
      data-storage-key={storageKey}
    >
      <h2 className="font-display text-[28px] font-bold leading-none text-ink">{title}</h2>
      <div className="mt-3 h-[3px] w-10 rounded bg-brand-red" />
      <p className="lead-notice mt-3 hidden text-sm text-brand-red" />
      <input type="hidden" name="publicKey" defaultValue="" />
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var f=document.currentScript&&document.currentScript.closest("form");if(!f)return;var key=f.getAttribute("data-storage-key")||"askinvest_pk";var k=sessionStorage.getItem(key);if(!k){k=Math.random().toString(36).slice(2)+Date.now().toString(36);sessionStorage.setItem(key,k);}var n=f.querySelector('input[name="publicKey"]');if(n)n.value=k;var q=new URLSearchParams(location.search).get("lead");var note=f.querySelector(".lead-notice");if(note&&q==="error"){note.textContent="Не удалось сохранить. Оставьте текст и нажмите ещё раз.";note.classList.remove("hidden");}if(note&&q==="channel"){note.textContent="Выбранный канал пока недоступен. Попробуйте другой.";note.classList.remove("hidden");}}catch(e){}})();`,
        }}
      />
      <input type="hidden" name="sourcePage" value={sourcePage || "/"} />
      <input type="hidden" name="intent" value={intent} />
      {serviceId ? <input type="hidden" name="serviceId" value={serviceId} /> : null}
      {propertyId ? <input type="hidden" name="propertyId" value={propertyId} /> : null}
      <label className="mt-5 block">
        <span className="sr-only">Вопрос</span>
        <textarea
          className="field min-h-[132px] resize-y bg-white"
          name="question"
          placeholder="Чем можем помочь?"
          required
        />
      </label>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {channels.map((channel, index) => (
          <label
            key={channel.id}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-2 py-2.5 text-sm font-semibold text-ink has-[:checked]:border-sky-300 has-[:checked]:bg-sky-50 has-[:checked]:shadow-sm"
          >
            <input
              type="radio"
              name="channel"
              value={channel.id}
              defaultChecked={index === 0}
              className="sr-only"
            />
            {channel.icon}
            {channel.label}
          </label>
        ))}
      </div>
      <button className="btn-primary mt-5 w-full justify-between rounded-2xl px-5 py-3.5 text-base" type="submit">
        <span>{title}</span>
        <span aria-hidden className="text-xl">
          →
        </span>
      </button>
    </form>
  );
}
