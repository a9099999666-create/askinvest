export function TelegramIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10" fill="#2AABEE" />
      <path
        fill="#fff"
        d="M17.4 7.6 15.2 16c-.2.7-.6.9-1.2.5l-2.4-1.8-1.2 1.1c-.1.1-.3.3-.6.3l.2-2.5 4.6-4.1c.2-.2 0-.3-.3-.1l-5.7 3.6-2.4-.8c-.5-.1-.5-.5.1-.8l9.5-3.7c.4-.1.8.1.8.7Z"
      />
    </svg>
  );
}

export function MaxIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <span
      className={`inline-grid place-items-center rounded-full bg-[#7b5cff] text-[9px] font-bold leading-none text-white ${className}`}
    >
      M
    </span>
  );
}

export function WhatsIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10" fill="#25D366" />
      <path
        fill="#fff"
        d="M12 6.2a5.6 5.6 0 0 0-4.8 8.5l-.6 2.3 2.4-.6A5.6 5.6 0 1 0 12 6.2Zm3.2 7.9c-.1.4-.8.7-1.1.7-.3 0-.6 0-1-.1-.2 0-.5-.2-.8-.3-1.4-.7-2.3-2.1-2.3-2.2 0-.1-.6-.8-.6-1.5s.4-1 .5-1.2c.1-.1.3-.2.4-.2h.3c.1 0 .2 0 .3.2.1.3.4 1 .4 1.1 0 .1 0 .2-.1.3l-.2.2c-.1.1-.1.2 0 .3.1.2.5.7 1 1.2.7.6 1.2.7 1.4.8.1.1.3.1.3-.1l.4-.4c.1-.1.2-.1.3-.1.2 0 .9.4 1 .5.1.1.2.1.3.2 0 .1 0 .4-.1.6Z"
      />
    </svg>
  );
}

export function channelIcon(channel: string, className = "h-4 w-4") {
  if (channel === "telegram") return <TelegramIcon className={className} />;
  if (channel === "max") return <MaxIcon className={className} />;
  if (channel === "whatsapp") return <WhatsIcon className={className} />;
  return (
    <span className={`inline-grid place-items-center rounded-full bg-slate-200 text-[9px] font-bold text-ink ${className}`}>
      T
    </span>
  );
}

export function channelLabel(channel: string) {
  if (channel === "telegram") return "Telegram";
  if (channel === "max") return "MAX";
  if (channel === "whatsapp") return "WhatsApp";
  return "Тест";
}
