"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/public/Logo";
import { cn } from "@/lib/utils";

const nav = [
  {
    group: "Сайт",
    items: [
      { href: "/admin/properties", label: "Объекты" },
      { href: "/admin/services", label: "Услуги" },
    ],
  },
  {
    group: "CRM",
    items: [
      { href: "/admin/leads", label: "Заявки" },
      { href: "/admin/inbox", label: "Диалоги" },
      { href: "/admin/contacts", label: "Контакты" },
      { href: "/admin/campaigns", label: "Рассылки" },
    ],
  },
];

export function AdminShell({
  userName,
  isOwner,
  children,
}: {
  userName: string;
  isOwner: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-atmosphere">
      <div className="mx-auto flex min-h-screen max-w-[1400px]">
        <aside className="hidden w-60 shrink-0 border-r border-white/50 bg-white/40 p-4 backdrop-blur md:block">
          <Logo />
          <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-medium text-ink shadow-sm">
            Закрытый кабинет
          </div>
          <nav className="mt-6 space-y-5">
            {nav.map((g) => (
              <div key={g.group}>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/50">
                  {g.group}
                </div>
                <ul className="space-y-1">
                  {g.items.map((item) => {
                    const active = pathname.startsWith(item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "block rounded-lg px-3 py-2 text-sm font-medium",
                            active
                              ? "border-l-2 border-brand-red bg-sky-100 text-ink"
                              : "text-ink/70 hover:bg-white/70",
                          )}
                        >
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
            {isOwner && (
              <Link
                href="/admin/staff"
                className="block rounded-lg px-3 py-2 text-sm font-medium text-ink/70 hover:bg-white/70"
              >
                Сотрудники
              </Link>
            )}
            <Link
              href="/admin/settings"
              className="block rounded-lg px-3 py-2 text-sm font-medium text-ink/70 hover:bg-white/70"
            >
              Каналы
            </Link>
          </nav>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between gap-3 border-b border-white/40 px-4 py-4 md:px-6">
            <div className="md:hidden">
              <Logo />
            </div>
            <div className="ml-auto flex items-center gap-3 text-sm">
              <span className="rounded-full bg-white/80 px-3 py-1.5 font-medium text-ink">
                {userName}
              </span>
              <form action="/api/auth/logout" method="post">
                <button className="btn-ghost" type="submit">
                  Выйти
                </button>
              </form>
            </div>
          </header>
          <div className="flex-1 p-4 md:p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
