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
      <AskinvestMark className="h-9 w-9 shrink-0 drop-shadow-[0_8px_18px_rgba(0,162,231,0.3)] sm:h-10 sm:w-10" />
      {compact ? null : (
        <span className="font-sans text-[15px] font-semibold tracking-[0.16em] text-ink sm:text-[17px]">
          АСКИНВЕСТ
        </span>
      )}
    </Link>
  );
}
