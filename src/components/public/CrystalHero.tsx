export function CrystalHero({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`} aria-hidden>
      <svg
        viewBox="0 0 640 420"
        className="animate-float h-auto w-full max-w-xl drop-shadow-xl"
        role="img"
      >
        <defs>
          <linearGradient id="ruby" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ff4d5e" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#b10f1d" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7ad7ff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#1a7adf" stopOpacity="0.75" />
          </linearGradient>
          <linearGradient id="shine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <filter id="soft">
            <feGaussianBlur stdDeviation="1.2" />
          </filter>
        </defs>
        <ellipse
          cx="320"
          cy="360"
          rx="220"
          ry="28"
          fill="#9ec8e8"
          opacity="0.45"
        />
        <g opacity="0.95">
          <path d="M120 300 L200 120 L280 300 Z" fill="url(#ruby)" />
          <path d="M200 120 L280 300 L240 300 Z" fill="#7a0c16" opacity="0.35" />
          <path d="M200 120 L160 210 L240 210 Z" fill="url(#shine)" />
        </g>
        <g>
          <path d="M250 310 L330 80 L410 310 Z" fill="url(#glass)" />
          <path d="M330 80 L410 310 L370 310 Z" fill="#0d4f96" opacity="0.3" />
          <path d="M330 80 L290 180 L370 180 Z" fill="url(#shine)" />
          <rect
            x="310"
            y="150"
            width="40"
            height="120"
            fill="#fff"
            opacity="0.12"
          />
        </g>
        <g>
          <path d="M380 320 L455 140 L530 320 Z" fill="url(#ruby)" />
          <path d="M455 140 L530 320 L500 320 Z" fill="#8c101c" opacity="0.35" />
          <path d="M455 140 L420 220 L490 220 Z" fill="url(#shine)" />
        </g>
        <g opacity="0.85">
          <path d="M160 330 L220 220 L280 330 Z" fill="url(#glass)" />
          <path d="M480 335 L535 230 L590 335 Z" fill="url(#glass)" />
        </g>
      </svg>
    </div>
  );
}
