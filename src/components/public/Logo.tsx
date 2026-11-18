import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/logo.png"
        alt="АСКИНВЕСТ"
        width={40}
        height={40}
        className="h-10 w-10 object-contain"
      />
      <span className="font-display text-[19px] font-bold tracking-[0.04em] text-ink">
        АСКИНВЕСТ
      </span>
    </Link>
  );
}
