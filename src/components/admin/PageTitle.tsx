export function PageTitle({
  title,
  className = "",
  subtitle,
}: {
  title: string;
  className?: string;
  subtitle?: string;
}) {
  return (
    <div className={className}>
      <h1 className="font-display text-[clamp(1.75rem,5vw,2.5rem)] font-bold leading-none tracking-tight text-ink">
        {title}
      </h1>
      <div className="mt-3 h-[3px] w-14 rounded-full bg-gradient-to-r from-brand-cyan to-brand-red" />
      {subtitle ? <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/60">{subtitle}</p> : null}
    </div>
  );
}
