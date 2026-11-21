import { Logo } from "@/components/public/Logo";
import { getPublicContacts } from "@/lib/public/cache";

export async function SiteFooter() {
  const contacts = await getPublicContacts();
  const hours = contacts.hours || "Ответим в рабочие часы по Москве";

  return (
    <footer className="mx-auto flex w-full max-w-6xl flex-col items-center gap-3 px-4 pb-8 pt-4 md:px-6">
      <Logo className="opacity-90" />
      <p className="text-center text-xs text-ink/35">{hours}</p>
    </footer>
  );
}
