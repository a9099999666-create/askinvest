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
  return (
    <form
      className="glass-panel rounded-[28px] p-6 md:p-7"
      action="/api/leads"
      method="post"
    >
      <h2 className="font-display text-[28px] font-bold leading-none text-ink">{title}</h2>
      <div className="mt-3 h-[3px] w-10 rounded bg-brand-red" />
      <input type="hidden" name="publicKey" defaultValue="" className="askinvest-public-key" />
      <script
        dangerouslySetInnerHTML={{
          __html:
            '(function(){try{var k=sessionStorage.getItem("askinvest_pk");if(!k){k=Math.random().toString(36).slice(2)+Date.now().toString(36);sessionStorage.setItem("askinvest_pk",k);}var n=document.currentScript&&document.currentScript.previousElementSibling;if(n)n.value=k;}catch(e){}})();',
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
