"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/public/Logo";
import type { Permissions } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils";
import {
  IconBell,
  IconCase,
  IconChat,
  IconClipboard,
  IconLayers,
  IconLock,
  IconMail,
  IconUser,
  IconUsers,
} from "./icons";

const siteNav = [
  { href: "/cabinet/properties", label: "Объекты", icon: IconLayers },
  { href: "/cabinet/services", label: "Услуги", icon: IconCase },
  { href: "/cabinet/settings", label: "Каналы", icon: IconBell },
];

const crmNav: {
  href: string;
  label: string;
  icon: typeof IconClipboard;
  permission: keyof Permissions;
}[] = [
  { href: "/cabinet/leads", label: "Заявки", icon: IconClipboard, permission: "leads" },
  { href: "/cabinet/inbox", label: "Диалоги", icon: IconChat, permission: "leads" },
  { href: "/cabinet/contacts", label: "Контакты", icon: IconUsers, permission: "contacts" },
  { href: "/cabinet/campaigns", label: "Рассылки", icon: IconMail, permission: "campaigns" },
];

export function AdminShell({
  userName,
  isOwner,
  permissions,
  children,
}: {
  userName: string;
  isOwner: boolean;
  permissions: Permissions;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const crmItems = crmNav.filter(
    (item) => isOwner || Boolean(permissions?.[item.permission]),
  );
  const siteItems = siteNav.filter((item) => {
    if (item.href === "/cabinet/services") {
      return isOwner || Boolean(permissions?.editContent);
    }
    return true;
  });
  const groups = [
    { group: "Сайт", items: siteItems },
    ...(crmItems.length ? [{ group: "CRM", items: crmItems }] : []),
    ...(isOwner
      ? [
          {
            group: "Команда",
            items: [{ href: "/cabinet/staff", label: "Сотрудники", icon: IconUsers }],
          },
        ]
      : []),
  ];

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const nav = (showBrand: boolean) => (
    <>
      {showBrand ? (
        <div className="mb-6">
          <Logo href="/cabinet/properties" />
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-ink/[0.04] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/50">
            <IconLock className="h-3.5 w-3.5" />
            Кабинет
          </p>
        </div>
      ) : null}
      <nav className="space-y-6">
        {groups.map((g) => (
          <div key={g.group}>
            <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/35">
              {g.group}
            </div>
            <ul className="space-y-1">
              {g.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "relative flex min-h-11 items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-semibold transition",
                        active
                          ? "bg-white text-ink shadow-sm"
                          : "text-ink/70 hover:bg-white/70 hover:text-ink",
                      )}
                    >
                      {active ? (
                        <span className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-gradient-to-b from-brand-cyan to-brand-red" />
                      ) : null}
                      <Icon className={active ? "text-brand-cyan" : "text-ink/40"} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </>
  );

  return (
    <div className="cabinet-shell relative min-h-dvh">
      <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-white/60 bg-white/80 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md md:hidden">
        <Logo href="/cabinet/properties" compact />
        <div className="flex min-w-0 items-center gap-2">
          <UserMenu userName={userName} compact />
          <button
            type="button"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-ink shadow-sm"
            aria-expanded={menuOpen}
            aria-controls="cabinet-drawer"
            aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
            onClick={() => setMenuOpen((value) => !value)}
          >
            {menuOpen ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
                <path d="M5 7h14M5 12h14M5 17h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-[#0f2744]/35 md:hidden"
          aria-label="Закрыть меню"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <div className="relative mx-auto flex min-h-dvh max-w-[1400px] flex-col md:flex-row">
        <aside
          id="cabinet-drawer"
          className={cn(
            "cabinet-sidebar fixed inset-y-0 left-0 z-50 w-[min(100%,288px)] overflow-y-auto px-4 py-5 shadow-panel transition-transform duration-200 md:hidden",
            menuOpen ? "translate-x-0" : "invisible -translate-x-full",
          )}
          aria-hidden={!menuOpen}
          inert={!menuOpen}
        >
          {nav(true)}
        </aside>
        <aside className="cabinet-sidebar hidden shrink-0 md:flex md:w-[248px] md:flex-col md:px-4 md:py-6">
          {nav(true)}
        </aside>
        <div className="relative min-w-0 flex-1">
          <div className="hidden items-center justify-end px-6 pb-0 pt-5 md:flex">
            <UserMenu userName={userName} />
          </div>
          <div className="relative z-10 px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-5 md:px-8 md:pt-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function UserMenu({ userName, compact = false }: { userName: string; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/80 bg-white py-1 pl-1 pr-3 text-sm font-semibold text-ink shadow-sm"
        aria-expanded={open}
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-brand-cyan/20 to-brand-red/15 text-ink/70">
          <IconUser />
        </span>
        <span className={compact ? "max-w-[7rem] truncate" : "max-w-[14rem] truncate"}>
          {userName}
        </span>
        <span className="text-ink/35" aria-hidden>
          ▾
        </span>
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-48 rounded-2xl border border-slate-100 bg-white p-1.5 text-sm shadow-panel">
          <Link
            href="/cabinet/settings"
            className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-slate-50"
            onClick={() => setOpen(false)}
          >
            <IconBell className="h-4 w-4" />
            Каналы
          </Link>
          <form action="/api/auth/logout" method="post">
            <button type="submit" className="w-full rounded-xl px-3 py-2 text-left hover:bg-slate-50">
              Выйти
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
