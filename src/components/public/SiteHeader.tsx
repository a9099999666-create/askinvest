import { Logo } from "./Logo";
import { PublicNav } from "./PublicNav";

export function SiteHeader() {
  return (
    <header className="relative z-20 mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-center sm:justify-between md:px-6">
      <Logo className="shrink-0" />
      <PublicNav />
    </header>
  );
}
