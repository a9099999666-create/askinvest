"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";

const links = [
  { href: "/services", label: "Услуги" },
  { href: "/properties", label: "Недвижимость" },
  { href: "/contacts", label: "Контакты" },
];

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 md:px-6">
      <Logo />
      <nav className="flex items-center gap-4 text-sm font-semibold text-ink md:gap-8">
        {links.map((l) => {
          const active =
            pathname === l.href || pathname.startsWith(l.href + "/");
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "relative pb-1 transition",
                active ? "text-ink" : "text-ink/70 hover:text-ink",
              )}
            >
              {l.label}
              {active && (
                <span className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded bg-brand-red" />
              )}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
