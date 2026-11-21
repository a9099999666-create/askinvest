import Link from "next/link";

export default function PublicNotFound() {
  return (
    <div className="max-w-xl pt-10">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/45">
        АСКИНВЕСТ
      </p>
      <h1 className="mt-3 font-display text-5xl font-semibold leading-none text-ink">
        Страница не найдена
      </h1>
      <div className="accent-line mt-5" />
      <p className="mt-4 text-ink/70">
        Такой страницы нет. Вернитесь на главную или выберите услугу и объект в меню.
      </p>
      <Link href="/" className="btn-primary mt-6 inline-flex">
        На главную
      </Link>
    </div>
  );
}
