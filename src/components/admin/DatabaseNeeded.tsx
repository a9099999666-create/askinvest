import { Logo } from "@/components/public/Logo";

const VERCEL_STORAGE =
  "https://vercel.com/myray666/askinvest/stores";

export function DatabaseNeeded() {
  return (
    <div className="cabinet-shell flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="cabinet-card w-full max-w-md p-6 sm:p-8">
        <Logo />
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/40">
          Закрытый кабинет
        </p>
        <h1 className="mt-2 font-display text-[clamp(1.7rem,5vw,2.1rem)] font-bold leading-none text-ink">
          Подключите базу
        </h1>
        <div className="mt-3 h-[3px] w-10 rounded-full bg-gradient-to-r from-brand-cyan to-brand-red" />
        <p className="mt-4 text-sm leading-relaxed text-ink/70">
          Сайт открыт, но кабинет хранит объекты и заявки в Postgres. На
          Vercel её нужно создать один раз — ссылку в чат присылать не нужно.
        </p>
        <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-ink/80">
          <li>
            Откройте{" "}
            <a
              className="font-semibold text-brand-red underline decoration-brand-red/30 underline-offset-2"
              href={VERCEL_STORAGE}
              target="_blank"
              rel="noreferrer"
            >
              Storage проекта askinvest
            </a>
          </li>
          <li>
            Create Database → Postgres. Подключите к Production.
          </li>
          <li>Redeploy. Затем вернитесь на эту страницу.</li>
        </ol>
        <p className="mt-5 text-sm leading-relaxed text-ink/70">
          После деплоя здесь снова будет форма владельца. Email и пароль
          задаёте вы — в чат их не пишите.
        </p>
      </div>
    </div>
  );
}
