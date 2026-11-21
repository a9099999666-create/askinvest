import Link from "next/link";
import { AskinvestMark } from "@/components/brand/AskinvestMark";
import { cn } from "@/lib/utils";

export function Logo({
  className = "",
  compact = false,
  href = "/",
}: {
  className?: string;
  compact?: boolean;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("inline-flex items-center gap-2.5", className)}
      aria-label="АСКИНВЕСТ"
    >
      <AskinvestMark className="h-9 w-9 shrink-0 sm:h-11 sm:w-11" />
      {compact ? null : (
        <span className="truncate font-sans text-[13px] font-semibold tracking-[0.14em] text-ink sm:text-[17px] sm:tracking-[0.16em]">
          АСКИНВЕСТ
        </span>
      )}
    </Link>
  );
}
