import { useId } from "react";

export function GlassFolder({ className = "" }: { className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const ref = (name: string) => `${uid}${name}`;
  return (
    <svg
      viewBox="0 0 520 340"
      className={`crystal-hero h-auto w-full drop-shadow-xl ${className}`}
      aria-hidden
    >
      <defs>
        <linearGradient id={ref("red")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffb4bc" stopOpacity="0.55" />
          <stop offset="45%" stopColor="#ff4d5c" stopOpacity="0.72" />
          <stop offset="100%" stopColor="#c41222" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id={ref("blue")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#d9f6ff" stopOpacity="0.75" />
          <stop offset="50%" stopColor="#3ec8f5" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#1a6fe0" stopOpacity="0.72" />
        </linearGradient>
        <linearGradient id={ref("paper")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e7f1fb" />
        </linearGradient>
        <filter id={ref("blur")} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
        <linearGradient id={ref("sheen")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fff" stopOpacity="0" />
          <stop offset="50%" stopColor="#fff" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <ellipse cx="260" cy="292" rx="170" ry="22" fill="#9ec8e8" opacity="0.45" filter={`url(#${ref("blur")})`} />
      <ellipse cx="250" cy="286" rx="120" ry="10" fill="#fff" opacity="0.7" />
      <g className="crystal-block crystal-block-a">
        <path d="M78 214 168 118 292 156 214 250Z" fill={`url(#${ref("red")})`} />
        <path d="M168 118 292 156 268 196 150 158Z" fill="#fff" opacity="0.28" />
        <path d="M120 196 196 150 250 170 176 214Z" fill="#fff" opacity="0.12" />
      </g>
      <g className="crystal-block crystal-block-b">
        <path d="M168 236 300 132 452 196 318 300Z" fill={`url(#${ref("blue")})`} />
        <path d="M300 132 452 196 430 230 286 168Z" fill="#fff" opacity="0.35" />
        <g transform="rotate(-16 340 190)">
          <rect x="286" y="128" width="118" height="78" rx="6" fill={`url(#${ref("paper")})`} />
          <path d="M300 150h86M300 164h72M300 178h58" stroke="#b7c9da" strokeWidth="3" strokeLinecap="round" />
        </g>
        <g transform="rotate(-8 360 210)">
          <rect x="318" y="156" width="108" height="70" rx="6" fill="#fff" opacity="0.92" />
          <path d="M332 176h78M332 190h64M332 204h48" stroke="#c5d4e4" strokeWidth="3" strokeLinecap="round" />
        </g>
        <rect className="crystal-sheen" x="-40" y="120" width="70" height="180" fill={`url(#${ref("sheen")})`} opacity="0.8" />
      </g>
    </svg>
  );
}
