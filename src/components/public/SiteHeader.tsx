import { Logo } from "./Logo";
import { PublicNav } from "./PublicNav";

export function SiteHeader() {
  return (
    <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 md:px-6">
      <Logo />
      <PublicNav />
    </header>
  );
}
