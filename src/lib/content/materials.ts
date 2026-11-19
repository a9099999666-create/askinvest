import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { properties, propertyVersions, services, serviceVersions } from "@/db/schema";
import { asPlaceKind, placeKindLabel } from "@/lib/content/kinds";
import { formatArea } from "@/lib/utils";

export type MaterialItem = {
  id: string;
  href: string;
  title: string;
  subtitle: string;
  kind: "property" | "service";
  status: string;
  thumb: string | null;
};

function placeKindFrom(title: string, stored?: string | null) {
  if (stored) return placeKindLabel[asPlaceKind(stored)];
  const t = title.toLowerCase();
  if (t.includes("офис")) return placeKindLabel.office;
  if (t.includes("склад")) return placeKindLabel.warehouse;
  if (t.includes("торг")) return placeKindLabel.retail;
  if (t.includes("производ")) return placeKindLabel.production;
  return placeKindLabel.other;
}

function pickVersion<T extends { status: string; version: number; id: string }>(
  list: T[],
  publishedId: string | null,
) {
  return (
    list.find((v) => v.status === "draft" || v.status === "review") ||
    list.find((v) => v.id === publishedId) ||
    list[0]
  );
}

export async function loadMaterials(): Promise<MaterialItem[]> {
  const props = await db.select().from(properties).orderBy(desc(properties.updatedAt));
  const versions = await db.select().from(propertyVersions);
  const rows = await db.select().from(services).orderBy(desc(services.updatedAt));
  const serviceRows = await db.select().from(serviceVersions);

  const items: Array<MaterialItem & { updatedAt: number }> = [];

  for (const property of props) {
    const list = versions
      .filter((v) => v.propertyId === property.id)
      .sort((a, b) => b.version - a.version);
    const editable = pickVersion(list, property.publishedVersionId);
    if (!editable) continue;
    items.push({
      id: property.id,
      href: `/admin/properties/${property.id}`,
      title: editable.title,
      subtitle: `${placeKindFrom(editable.title, editable.placeKind)} · ${formatArea(editable.areaSqm)}`,
      kind: "property",
      status: editable.status,
      thumb: editable.coverId ? `/api/media/${editable.coverId}` : null,
      updatedAt: new Date(property.updatedAt).getTime(),
    });
  }

  for (const service of rows) {
    const list = serviceRows
      .filter((v) => v.serviceId === service.id)
      .sort((a, b) => b.version - a.version);
    const editable = pickVersion(list, service.publishedVersionId);
    if (!editable) continue;
    items.push({
      id: service.id,
      href: `/admin/services/${service.id}`,
      title: editable.title,
      subtitle: editable.shortDescription,
      kind: "service",
      status: editable.status,
      thumb: editable.imageId ? `/api/media/${editable.imageId}` : null,
      updatedAt: new Date(service.updatedAt).getTime(),
    });
  }

  return items
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .map(({ id, href, title, subtitle, kind, status, thumb }) => ({
      id,
      href,
      title,
      subtitle,
      kind,
      status,
      thumb,
    }));
}
