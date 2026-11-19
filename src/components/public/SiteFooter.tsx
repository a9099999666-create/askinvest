import Link from "next/link";
import { getPublicContacts } from "@/lib/public/cache";

export async function SiteFooter() {
  const contacts = await getPublicContacts();
  const hours = contacts.hours || "ответим в рабочие часы по Москве";

  return (
    <footer className="mx-auto mt-6 w-full max-w-6xl px-4 pb-10 pt-6 md:px-6">
      <div className="flex flex-col gap-3 border-t border-white/70 pt-6 text-sm text-ink/50 sm:flex-row sm:items-center sm:justify-between">
        <p>АСКИНВЕСТ · {hours}</p>
        <nav className="flex flex-wrap gap-4">
          <Link href="/services" className="hover:text-ink">
            Услуги
          </Link>
          <Link href="/properties" className="hover:text-ink">
            Недвижимость
          </Link>
          <Link href="/contacts" className="hover:text-ink">
            Контакты
          </Link>
        </nav>
      </div>
    </footer>
  );
}
