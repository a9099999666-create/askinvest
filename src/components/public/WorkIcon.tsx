import type { WorkIconKind } from "@/lib/content/kinds";

export function WorkIcon({ kind }: { kind: WorkIconKind }) {
  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-ink/70">
      {kind === "doc" && (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path d="M7 3.5h7l4 4V20H7z" />
          <path d="M14 3.5V8h4M9 12h6M9 16h4" />
        </svg>
      )}
      {kind === "pen" && (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path d="M14 4h5v5M19 4 10 13" />
          <path d="M7 7H5.5A1.5 1.5 0 0 0 4 8.5v10A1.5 1.5 0 0 0 5.5 20h10a1.5 1.5 0 0 0 1.5-1.5V15" />
        </svg>
      )}
      {kind === "handshake" && (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path d="M8 13.5 5 16l3 2.5" />
          <path d="M16 13.5 19 16l-3 2.5" />
          <path d="m9 16 6-1" />
          <circle cx="8" cy="8" r="2" />
          <circle cx="16" cy="8" r="2" />
        </svg>
      )}
    </span>
  );
}
