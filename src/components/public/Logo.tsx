import Link from "next/link";
import { AskinvestMark } from "@/components/brand/AskinvestMark";
import { cn } from "@/lib/utils";

export function Logo({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href="/"
      className={cn("inline-flex items-center gap-2.5", className)}
      aria-label="АСКИНВЕСТ"
    >
      <AskinvestMark className="h-10 w-10 shrink-0 sm:h-11 sm:w-11" />
      {compact ? null : (
        <span className="font-sans text-[15px] font-semibold tracking-[0.16em] text-ink sm:text-[17px]">
          АСКИНВЕСТ
        </span>
      )}
    </Link>
  );
}
