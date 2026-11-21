import { Logo } from "./Logo";
import { PublicNav } from "./PublicNav";

export function SiteHeader() {
  return (
    <div className="sticky top-0 z-30 bg-[rgba(8,10,16,0.78)] md:bg-transparent">
      <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:px-6 md:py-6 md:pt-6">
        <Logo className="min-w-0 shrink" />
        <PublicNav />
      </header>
    </div>
  );
}
