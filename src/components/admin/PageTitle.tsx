export function PageTitle({
  title,
  className = "",
}: {
  title: string;
  className?: string;
}) {
  return (
    <div className={`pr-4 md:pr-40 ${className}`}>
      <h1 className="font-display text-[clamp(1.75rem,5vw,2.5rem)] font-bold leading-none tracking-tight text-ink">
        {title}
      </h1>
      <div className="mt-3 h-[3px] w-14 rounded-full bg-brand-red" />
    </div>
  );
}
