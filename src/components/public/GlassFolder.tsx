export function GlassFolder({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 360 240"
      className={`h-auto w-full max-w-sm drop-shadow-xl ${className}`}
      aria-hidden
    >
      <defs>
        <linearGradient id="foldRed" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff8a96" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#e11d2e" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id="foldBlue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9aebff" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#1a7adf" stopOpacity="0.45" />
        </linearGradient>
        <linearGradient id="paper" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="100%" stopColor="#eef6ff" />
        </linearGradient>
      </defs>
      <ellipse cx="180" cy="200" rx="120" ry="16" fill="#9ec8e8" opacity="0.45" />
      <g className="crystal-block crystal-block-a">
        <path d="M70 150 150 70 250 95 170 175Z" fill="url(#foldRed)" />
        <path d="M150 70 250 95 230 130 130 105Z" fill="#fff" opacity="0.25" />
      </g>
      <g className="crystal-block crystal-block-b">
        <path d="M110 170 210 95 310 130 210 205Z" fill="url(#foldBlue)" />
        <rect x="175" y="108" width="78" height="52" rx="4" fill="url(#paper)" transform="rotate(-18 214 134)" />
        <path d="M188 122h48M188 132h40M188 142h32" stroke="#9bb4cc" strokeWidth="2" transform="rotate(-18 214 134)" />
      </g>
    </svg>
  );
}
