export function InteriorShot({
  seed,
  className = "",
}: {
  seed: string;
  className?: string;
}) {
  const n = [...seed].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const variant = n % 3;
  if (variant === 1) return <Warehouse className={className} />;
  if (variant === 2) return <Meeting className={className} />;
  return <Office className={className} />;
}

function Office({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 640 400" className={className} aria-hidden preserveAspectRatio="xMidYMid slice">
      <rect width="640" height="400" fill="#e6edf2" />
      <rect x="36" y="28" width="568" height="250" fill="#d7ebf8" />
      <g stroke="#d5e0e8" strokeWidth="8">
        <path d="M36 28h568v250H36z" fill="none" />
        <path d="M225 28v250M414 28v250M36 150h568" />
      </g>
      <rect x="0" y="268" width="640" height="132" fill="#d5ddd4" />
      <rect x="70" y="300" width="90" height="100" fill="#c5cfc4" />
      <rect x="250" y="286" width="70" height="114" fill="#b7c3b4" />
      <rect x="430" y="250" width="150" height="28" rx="8" fill="#8ea888" />
      <rect x="455" y="268" width="120" height="18" fill="#6f8868" />
    </svg>
  );
}

function Warehouse({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 640 400" className={className} aria-hidden preserveAspectRatio="xMidYMid slice">
      <rect width="640" height="400" fill="#e4e7ea" />
      <rect x="40" y="36" width="250" height="150" fill="#d5dbe2" />
      <rect x="340" y="36" width="260" height="150" fill="#c9d2dc" />
      <rect y="300" width="640" height="100" fill="#ece7df" />
      <g fill="#e2b322">
        <rect x="120" y="250" width="28" height="90" />
        <rect x="300" y="250" width="28" height="90" />
        <rect x="480" y="250" width="28" height="90" />
      </g>
      <rect x="70" y="210" width="500" height="16" fill="#b7c0c8" />
      <rect x="180" y="150" width="280" height="70" fill="#d8dee4" />
    </svg>
  );
}

function Meeting({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 640 400" className={className} aria-hidden preserveAspectRatio="xMidYMid slice">
      <rect width="640" height="400" fill="#e7eef3" />
      <rect x="40" y="40" width="360" height="220" fill="#d5e6f2" />
      <rect x="210" y="40" width="10" height="220" fill="#f7fbfe" />
      <rect x="420" y="70" width="180" height="200" fill="#f4f7f8" stroke="#d5dee6" />
      <rect x="450" y="180" width="130" height="46" rx="6" fill="#c5d0da" />
      <rect x="40" y="300" width="560" height="70" fill="#d7ddd8" />
      <circle cx="80" cy="250" r="28" fill="#7ea36a" />
      <rect x="68" y="250" width="24" height="70" fill="#8d6a45" />
      <circle cx="560" cy="240" r="26" fill="#6f9460" />
      <rect x="548" y="240" width="22" height="80" fill="#cfd5d0" />
    </svg>
  );
}
