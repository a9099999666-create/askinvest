"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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
  { href: "/admin/properties", label: "Объекты", icon: IconLayers },
  { href: "/admin/services", label: "Услуги", icon: IconCase },
];

const crmNav: {
  href: string;
  label: string;
  icon: typeof IconClipboard;
  permission: keyof Permissions;
}[] = [
  { href: "/admin/leads", label: "Заявки", icon: IconClipboard, permission: "leads" },
  { href: "/admin/inbox", label: "Диалоги", icon: IconChat, permission: "leads" },
  { href: "/admin/contacts", label: "Контакты", icon: IconUsers, permission: "contacts" },
  { href: "/admin/campaigns", label: "Рассылки", icon: IconMail, permission: "campaigns" },
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
  const crmItems = crmNav.filter(
    (item) => isOwner || Boolean(permissions?.[item.permission]),
  );
  const siteItems = siteNav.filter((item) => {
    if (item.href === "/admin/services") {
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
            items: [{ href: "/admin/staff", label: "Сотрудники", icon: IconUsers }],
          },
        ]
      : []),
  ];
  return (
    <div className="relative min-h-screen bg-atmosphere">
      <div className="relative flex min-h-screen flex-col md:flex-row">
        <aside className="w-full shrink-0 px-4 py-4 md:w-[232px] md:px-4 md:py-5">
          <Logo />
          <div className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-ink shadow-sm">
            <IconLock className="h-4 w-4 text-ink/70" />
            Закрытый кабинет
          </div>
          <nav className="mt-6 flex gap-4 overflow-x-auto md:block md:space-y-6 md:overflow-visible">
            {groups.map((g) => (
              <div key={g.group} className="min-w-max md:min-w-0">
                <div className="mb-2 text-sm font-medium text-slate-400">{g.group}</div>
                <ul className="flex gap-1 md:block md:space-y-1">
                  {g.items.map((item) => {
                    const active = pathname === item.href || pathname.startsWith(item.href + "/");
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold",
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
        </aside>
        <div className="relative min-w-0 flex-1">
          <div className="absolute right-4 top-4 z-20 flex flex-col items-end gap-2 md:right-6">
            <UserMenu userName={userName} />
          </div>
          <div className="relative z-10 px-4 pb-10 pt-4 md:px-6 md:pt-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

function UserMenu({ userName }: { userName: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full bg-white/95 py-1 pl-1 pr-3 text-sm font-semibold text-ink shadow-sm"
        aria-expanded={open}
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-ink/60">
          <IconUser />
        </span>
        {userName}
        <span className="text-ink/40" aria-hidden>
          ▾
        </span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white p-1.5 text-sm shadow-panel">
          <Link
            href="/admin/settings"
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
