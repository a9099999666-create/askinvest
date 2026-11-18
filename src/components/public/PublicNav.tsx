"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/services", label: "Услуги" },
  { href: "/properties", label: "Недвижимость" },
  { href: "/contacts", label: "Контакты" },
];

export function PublicNav() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-4 text-sm font-semibold text-ink md:gap-8">
      {links.map((link) => {
        const active =
          pathname === link.href ||
          pathname.startsWith(`${link.href}/`) ||
          (pathname === "/" && link.href === "/services");
        return (
          <Link
            key={link.href}
            href={link.href}
            prefetch={false}
            className={`relative pb-1 transition ${
              active ? "text-ink" : "text-ink/70 hover:text-ink"
            }`}
          >
            {link.label}
            {active ? (
              <span className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded bg-brand-red" />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
