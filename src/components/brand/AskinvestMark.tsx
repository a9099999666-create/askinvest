import { useId } from "react";

export function AskinvestMark({ className = "h-9 w-9" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  const red = `ask-red-${id}`;
  const cyan = `ask-cyan-${id}`;
  const clip = `ask-shield-${id}`;

  return (
    <svg viewBox="0 0 80 80" className={className} aria-hidden role="img">
      <defs>
        <linearGradient id={red} x1="12" y1="8" x2="40" y2="76" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FF4046" />
          <stop offset="1" stopColor="#C10F1C" />
        </linearGradient>
        <linearGradient id={cyan} x1="68" y1="8" x2="40" y2="76" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#6AD6FA" />
          <stop offset="1" stopColor="#0078B4" />
        </linearGradient>
        <clipPath id={clip}>
          <path d="M40 6c14.2 0 27 5.2 28.8 15.4v22.2C68.8 59.6 53.4 71.2 40 78.4 26.6 71.2 11.2 59.6 11.2 43.6V21.4C13 11.2 25.8 6 40 6Z" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <path fill={`url(#${red})`} d="M11 6h27.2v74H11Z" />
        <path fill={`url(#${cyan})`} d="M41.8 6H69v74H41.8Z" />
        <path fill="#fff" fillOpacity="0.2" d="M11.2 6h57.6v16.5L40 28.5 11.2 22.5Z" />
        <path fill="#9B0C14" fillOpacity="0.22" d="M11 44h27.2v36H11Z" />
        <path fill="#045A86" fillOpacity="0.22" d="M41.8 44H69v36H41.8Z" />
      </g>
      <path
        fill="none"
        stroke="#fff"
        strokeOpacity="0.28"
        strokeWidth="1.4"
        d="M40 8.2c12.8 0 24.6 4.6 26.2 13.8v21.2C66.2 57.4 52.4 68.2 40 75.2 27.6 68.2 13.8 57.4 13.8 43.2V22C15.4 12.8 27.2 8.2 40 8.2Z"
      />
    </svg>
  );
}
