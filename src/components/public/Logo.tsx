import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center ${className}`}>
      <span className="font-display text-[22px] font-semibold tracking-[0.18em] text-ink">
        АСКИНВЕСТ
      </span>
    </Link>
  );
}
