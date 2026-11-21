import { useId } from "react";

export function AskinvestMark({ className = "h-9 w-9" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  const red = `ask-red-${id}`;
  const cyan = `ask-cyan-${id}`;

  return (
    <svg viewBox="0 0 80 80" className={className} aria-hidden role="img">
      <defs>
        <linearGradient id={red} x1="8" y1="8" x2="44" y2="72" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FF4046" />
          <stop offset="1" stopColor="#C10F1C" />
        </linearGradient>
        <linearGradient id={cyan} x1="74" y1="10" x2="40" y2="76" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#6AD6FA" />
          <stop offset="1" stopColor="#0078B4" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${red})`}
        d="M16.5 12.5 49 9.2 42.2 39.8 12.8 58.4 10.6 31.6Z"
      />
      <path
        fill="#9B0C14"
        fillOpacity="0.28"
        d="M16.5 12.5 42.2 39.8 12.8 58.4Z"
      />
      <path
        fill={`url(#${cyan})`}
        d="M51.6 9.5 71.8 15.2 76 36.6 63.2 72.8 48.4 77.4 44.2 41.2Z"
      />
      <path
        fill="#045A86"
        fillOpacity="0.28"
        d="M51.6 9.5 76 36.6 44.2 41.2Z"
      />
      <path fill="#fff" fillOpacity="0.22" d="M16.5 12.5 49 9.2 40 22.8Z" />
      <path fill="#fff" fillOpacity="0.16" d="M51.6 9.5 71.8 15.2 58.4 24.6Z" />
    </svg>
  );
}
