export function CrystalHero({ className = "" }: { className?: string }) {
  return (
    <div className={`crystal-hero relative ${className}`} aria-hidden>
      <svg
        viewBox="0 0 720 460"
        className="animate-float h-auto w-full max-w-xl"
        role="img"
      >
        <defs>
          <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c5e4f7" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#9ec8e8" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="rubyFront" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff6b78" stopOpacity="0.92" />
            <stop offset="45%" stopColor="#e11d2e" stopOpacity="0.88" />
            <stop offset="100%" stopColor="#8c101c" stopOpacity="0.82" />
          </linearGradient>
          <linearGradient id="rubySide" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#c41428" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#5c0812" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="rubyTop" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ff9aa4" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#e11d2e" stopOpacity="0.55" />
          </linearGradient>
          <linearGradient id="cyanFront" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8ae0ff" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#2ec5f0" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#0d5cad" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="cyanSide" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1a7adf" stopOpacity="0.88" />
            <stop offset="100%" stopColor="#063a75" stopOpacity="0.82" />
          </linearGradient>
          <linearGradient id="cyanTop" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#c9f2ff" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#2ec5f0" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fff" stopOpacity="0" />
            <stop offset="40%" stopColor="#fff" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#fff" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="glowRed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff4d5e" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ff4d5e" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="glowBlue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2ec5f0" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#2ec5f0" stopOpacity="0" />
          </linearGradient>
          <filter id="softBlur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
          <clipPath id="clipMain">
            <path d="M268 92 L348 52 L428 92 L428 318 L348 358 L268 318 Z" />
          </clipPath>
          <clipPath id="clipLeft">
            <path d="M148 168 L212 136 L276 168 L276 312 L212 344 L148 312 Z" />
          </clipPath>
          <clipPath id="clipRight">
            <path d="M420 148 L492 112 L564 148 L564 308 L492 344 L420 308 Z" />
          </clipPath>
          <clipPath id="clipFar">
            <path d="M520 198 L568 174 L616 198 L616 298 L568 322 L520 298 Z" />
          </clipPath>
        </defs>

        {/* Soft ground glow */}
        <ellipse cx="360" cy="380" rx="260" ry="34" fill="#9ec8e8" opacity="0.35" />
        <ellipse
          cx="360"
          cy="378"
          rx="200"
          ry="22"
          fill="url(#floor)"
          className="crystal-floor-pulse"
        />

        {/* Far small cyan prism */}
        <g className="crystal-block crystal-block-d">
          <path d="M520 198 L568 174 L616 198 L616 298 L568 322 L520 298 Z" fill="url(#cyanFront)" opacity="0.75" />
          <path d="M568 174 L616 198 L616 298 L568 322 Z" fill="url(#cyanSide)" opacity="0.7" />
          <path d="M520 198 L568 174 L616 198 L568 222 Z" fill="url(#cyanTop)" opacity="0.65" />
          <g clipPath="url(#clipFar)">
            <rect className="crystal-sheen" x="-80" y="160" width="70" height="180" fill="url(#sheen)" />
          </g>
        </g>

        {/* Left ruby prism */}
        <g className="crystal-block crystal-block-a">
          <ellipse cx="212" cy="330" rx="70" ry="14" fill="url(#glowRed)" filter="url(#softBlur)" />
          <path d="M148 168 L212 136 L276 168 L276 312 L212 344 L148 312 Z" fill="url(#rubyFront)" />
          <path d="M212 136 L276 168 L276 312 L212 344 Z" fill="url(#rubySide)" />
          <path d="M148 168 L212 136 L276 168 L212 200 Z" fill="url(#rubyTop)" />
          <path d="M170 200 L170 290 L195 302 L195 210 Z" fill="#fff" opacity="0.12" />
          <g clipPath="url(#clipLeft)">
            <rect className="crystal-sheen crystal-sheen-delay" x="-100" y="120" width="90" height="240" fill="url(#sheen)" />
          </g>
        </g>

        {/* Center cyan tower */}
        <g className="crystal-block crystal-block-b">
          <ellipse cx="348" cy="348" rx="95" ry="18" fill="url(#glowBlue)" filter="url(#softBlur)" />
          <path d="M268 92 L348 52 L428 92 L428 318 L348 358 L268 318 Z" fill="url(#cyanFront)" />
          <path d="M348 52 L428 92 L428 318 L348 358 Z" fill="url(#cyanSide)" />
          <path d="M268 92 L348 52 L428 92 L348 132 Z" fill="url(#cyanTop)" />
          <path d="M292 130 L292 280 L318 294 L318 142 Z" fill="#fff" opacity="0.14" />
          <path d="M330 145 L330 295 L346 305 L346 154 Z" fill="#fff" opacity="0.08" />
          <g clipPath="url(#clipMain)">
            <rect className="crystal-sheen" x="-120" y="40" width="110" height="340" fill="url(#sheen)" />
          </g>
        </g>

        {/* Right ruby prism */}
        <g className="crystal-block crystal-block-c">
          <ellipse cx="492" cy="336" rx="80" ry="15" fill="url(#glowRed)" filter="url(#softBlur)" />
          <path d="M420 148 L492 112 L564 148 L564 308 L492 344 L420 308 Z" fill="url(#rubyFront)" />
          <path d="M492 112 L564 148 L564 308 L492 344 Z" fill="url(#rubySide)" />
          <path d="M420 148 L492 112 L564 148 L492 184 Z" fill="url(#rubyTop)" />
          <path d="M444 178 L444 286 L468 298 L468 190 Z" fill="#fff" opacity="0.12" />
          <g clipPath="url(#clipRight)">
            <rect className="crystal-sheen crystal-sheen-slow" x="-90" y="100" width="100" height="260" fill="url(#sheen)" />
          </g>
        </g>

        {/* Reflective glass base plate */}
        <path
          d="M120 360 L360 400 L600 360 L360 330 Z"
          fill="#dff0fb"
          opacity="0.35"
          className="crystal-base"
        />
        <path
          d="M160 358 L360 388 L560 358 L360 338 Z"
          fill="#fff"
          opacity="0.18"
          className="crystal-base-shine"
        />
      </svg>
    </div>
  );
}
