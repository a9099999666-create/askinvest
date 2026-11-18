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
      <p className="lead-notice mt-3 hidden text-sm" />
      <input type="hidden" name="publicKey" defaultValue="" />
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var f=document.currentScript&&document.currentScript.closest("form");if(!f)return;var key=f.getAttribute("data-storage-key")||"askinvest_pk";var k=sessionStorage.getItem(key);if(!k){k=Math.random().toString(36).slice(2)+Date.now().toString(36);sessionStorage.setItem(key,k);}var n=f.querySelector('input[name="publicKey"]');if(n)n.value=k;var fields=["visitorName","visitorPhone","visitorEmail","question"];fields.forEach(function(name){var el=f.querySelector('[name="'+name+'"]');if(!el)return;var sk=key+"_"+name;var saved=sessionStorage.getItem(sk);if(saved&&!el.value)el.value=saved;el.addEventListener("input",function(){sessionStorage.setItem(sk,el.value);});});var q=new URLSearchParams(location.search).get("lead");var note=f.querySelector(".lead-notice");if(!note)return;if(q==="ok"){note.textContent="Заявка принята. Мы свяжемся с вами по указанным контактам.";note.className="lead-notice mt-3 text-sm text-emerald-700";fields.forEach(function(name){sessionStorage.removeItem(key+"_"+name);});}else if(q==="error"){note.textContent="Не удалось сохранить. Проверьте поля и нажмите ещё раз.";note.className="lead-notice mt-3 text-sm text-brand-red";note.classList.remove("hidden");}if(q==="ok"||q==="error")note.classList.remove("hidden");}catch(e){}})();`,
        }}
      />
      <input type="hidden" name="sourcePage" value={sourcePage || "/"} />
      <input type="hidden" name="intent" value={intent} />
      {serviceId ? <input type="hidden" name="serviceId" value={serviceId} /> : null}
      {propertyId ? <input type="hidden" name="propertyId" value={propertyId} /> : null}
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm text-ink/70">ФИО</span>
          <input className="field bg-white" name="visitorName" autoComplete="name" required placeholder="Иван Иванов" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-ink/70">Телефон</span>
          <input className="field bg-white" name="visitorPhone" type="tel" autoComplete="tel" required placeholder="+7 900 000-00-00" />
        </label>
      </div>
      <label className="mt-3 block">
        <span className="mb-1 block text-sm text-ink/70">Email</span>
        <input className="field bg-white" name="visitorEmail" type="email" autoComplete="email" placeholder="необязательно" />
      </label>
      <label className="mt-3 block">
        <span className="mb-1 block text-sm text-ink/70">Задача</span>
        <textarea
          className="field min-h-[108px] resize-y bg-white"
          name="question"
          placeholder="Чем можем помочь?"
          required
        />
      </label>
      <p className="mt-4 text-sm font-medium text-ink/70">Удобный способ связи</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
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
        <span>Отправить заявку</span>
        <span aria-hidden className="text-xl">
          →
        </span>
      </button>
    </form>
  );
}
