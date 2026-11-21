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
    <nav className="flex max-w-full flex-wrap items-center justify-start gap-x-4 gap-y-1 text-[14px] font-semibold text-ink sm:justify-end sm:gap-6 sm:text-[15px] md:gap-10">
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
            className={`relative pb-1 transition duration-200 ${
              active ? "text-ink" : "text-ink/70 hover:text-ink"
            }`}
          >
            {link.label}
            {active ? (
              <span className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded bg-gradient-to-r from-brand-cyan to-brand-red" />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
