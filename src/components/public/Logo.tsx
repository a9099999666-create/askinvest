import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center ${className}`}>
      <span className="font-display text-[19px] font-bold tracking-[0.04em] text-ink">
        АСКИНВЕСТ
      </span>
    </Link>
  );
}
