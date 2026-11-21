export function PageTitle({
  title,
  className = "",
}: {
  title: string;
  className?: string;
}) {
  return (
    <div className={`pr-4 sm:pr-40 ${className}`}>
      <h1 className="font-display text-[32px] font-bold leading-none tracking-tight text-ink md:text-[40px]">
        {title}
      </h1>
      <div className="mt-3 h-[3px] w-14 rounded-full bg-brand-red" />
    </div>
  );
}
