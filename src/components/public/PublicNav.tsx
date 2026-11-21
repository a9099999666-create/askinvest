"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";

const links = [
  { href: "/services", label: "Услуги" },
  { href: "/properties", label: "Недвижимость" },
  { href: "/contacts", label: "Контакты" },
];

function isActive(pathname: string, href: string) {
  return (
    pathname === href ||
    pathname.startsWith(`${href}/`) ||
    (pathname === "/" && href === "/services")
  );
}

export function PublicNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuId = useId();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="flex items-center">
      <nav className="hidden items-center gap-8 text-[15px] font-semibold md:flex lg:gap-10">
        {links.map((link) => (
          <NavLink key={link.href} href={link.href} label={link.label} active={isActive(pathname, link.href)} />
        ))}
      </nav>

      <button
        type="button"
        className="grid h-11 w-11 place-items-center rounded-2xl border border-white/20 bg-white/10 text-ink md:hidden"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={open ? "Закрыть меню" : "Открыть меню"}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
            <path d="M5 7h14M5 12h14M5 17h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {open ? (
        <nav
          id={menuId}
          className="absolute left-4 right-4 top-full z-40 mt-1 flex flex-col gap-1 rounded-[24px] border border-white/15 bg-[rgba(10,12,18,0.94)] p-2 shadow-panel md:hidden"
        >
          {links.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch={false}
                className={`rounded-2xl px-4 py-3.5 text-[16px] font-semibold ${
                  active ? "bg-white/12 text-ink" : "text-ink/80"
                }`}
              >
                {link.label}
                {active ? (
                  <span className="mt-1.5 block h-0.5 w-10 rounded bg-gradient-to-r from-brand-cyan to-brand-red" />
                ) : null}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}

function NavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      className={`relative pb-1 transition duration-200 ${
        active ? "text-ink" : "text-ink/70 hover:text-ink"
      }`}
    >
      {label}
      {active ? (
        <span className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded bg-gradient-to-r from-brand-cyan to-brand-red" />
      ) : null}
    </Link>
  );
}
