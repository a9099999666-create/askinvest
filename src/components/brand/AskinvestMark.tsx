export function AskinvestMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/mark.png"
      alt=""
      className={className}
      width={80}
      height={80}
    />
  );
}
