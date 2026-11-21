import { Logo } from "./Logo";
import { PublicNav } from "./PublicNav";

export function SiteHeader() {
  return (
    <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-6 md:px-6">
      <Logo className="shrink-0" />
      <PublicNav />
    </header>
  );
}
