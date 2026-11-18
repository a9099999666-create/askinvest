import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/logo.png"
        alt="АСКИНВЕСТ"
        width={36}
        height={36}
        className="h-9 w-9 object-contain"
      />
      <span className="font-display text-lg font-bold tracking-wide text-ink">
        АСКИНВЕСТ
      </span>
    </Link>
  );
}
