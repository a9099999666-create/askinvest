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

  const nav = (
    <>
      <div className="hidden md:block">
        <Logo href="/cabinet/properties" />
        <div className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-ink shadow-sm">
          <IconLock className="h-4 w-4 text-ink/70" />
          Закрытый кабинет
        </div>
      </div>
      <nav className="mt-2 space-y-6 md:mt-6">
        {groups.map((g) => (
          <div key={g.group}>
            <div className="mb-2 text-sm font-medium text-slate-400">{g.group}</div>
            <ul className="space-y-1">
              {g.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex min-h-11 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold",
                        active
                          ? "bg-white text-ink shadow-sm"
                          : "text-ink/75 hover:bg-white/70",
                      )}
                    >
                      <Icon className={active ? "text-ink" : "text-ink/55"} />
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
    <div className="relative min-h-dvh bg-atmosphere">
      <div className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-[#d9ecf8]/90 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:hidden">
        <Logo href="/cabinet/properties" compact />
        <div className="flex min-w-0 items-center gap-2">
          <UserMenu userName={userName} compact />
          <button
            type="button"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-ink shadow-sm"
            aria-expanded={menuOpen}
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
          className="fixed inset-0 z-40 bg-black/35 md:hidden"
          aria-label="Закрыть меню"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <div className="relative flex min-h-dvh flex-col md:flex-row">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-[min(100%,280px)] overflow-y-auto bg-[#d9ecf8] px-4 py-5 shadow-panel transition-transform duration-200 md:static md:z-auto md:w-[232px] md:translate-x-0 md:overflow-visible md:bg-transparent md:px-4 md:py-5 md:shadow-none",
            menuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          )}
        >
          {nav}
        </aside>
        <div className="relative min-w-0 flex-1">
          <div className="absolute right-4 top-4 z-20 hidden flex-col items-end gap-2 md:right-6 md:flex">
            <UserMenu userName={userName} />
          </div>
          <div className="relative z-10 px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-4 md:px-6 md:pt-5">
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
        className="inline-flex max-w-full items-center gap-2 rounded-full bg-white/95 py-1 pl-1 pr-3 text-sm font-semibold text-ink shadow-sm"
        aria-expanded={open}
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-ink/60">
          <IconUser />
        </span>
        <span className={compact ? "max-w-[7rem] truncate" : "max-w-[12rem] truncate"}>
          {userName}
        </span>
        <span className="text-ink/40" aria-hidden>
          ▾
        </span>
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-48 rounded-2xl bg-white p-1.5 text-sm shadow-panel">
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
