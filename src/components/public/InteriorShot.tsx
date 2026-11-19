import type { PlaceKind } from "@/lib/content/kinds";

const files: Record<PlaceKind, string> = {
  office: "/brand/interiors/office.jpg",
  warehouse: "/brand/interiors/warehouse.jpg",
  retail: "/brand/interiors/retail.jpg",
  production: "/brand/interiors/warehouse.jpg",
  other: "/brand/interiors/office.jpg",
};

export function InteriorShot({
  seed,
  kind,
  className = "",
}: {
  seed: string;
  kind?: PlaceKind;
  className?: string;
}) {
  const n = [...seed].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const fallback: PlaceKind = n % 3 === 1 ? "warehouse" : n % 3 === 2 ? "retail" : "office";
  const src = files[kind || fallback];
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className={`object-cover ${className}`} />
  );
}
