import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { PropertyEditor } from "@/components/admin/PropertyEditor";
import { db } from "@/db/client";
import { mediaAssets, propertyVersions } from "@/db/schema";
import { can } from "@/lib/auth/permissions";
import { getSessionUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();
  const rows = await db
    .select()
    .from(propertyVersions)
    .where(eq(propertyVersions.propertyId, id))
    .orderBy(desc(propertyVersions.version));
  const current = rows[0];
  if (!current) notFound();
  const floor = current.floorPlanId
    ? await db.query.mediaAssets.findFirst({
        where: eq(mediaAssets.id, current.floorPlanId),
      })
    : null;

  return (
    <PropertyEditor
      propertyId={id}
      heading="Редактирование объекта"
      canPublish={Boolean(user && can(user, "publish"))}
      initial={{
        title: current.title,
        address: current.address,
        dealType: current.dealType,
        placeKind: current.placeKind,
        areaSqm: String(current.areaSqm),
        priceRub: String(current.priceRub),
        priceUnit: current.priceUnit,
        description: current.description,
        coverId: current.coverId,
        galleryIds: current.galleryIds || [],
        floorPlanId: current.floorPlanId,
        floorPlanName: floor?.originalName || null,
        floorPlanSize: floor?.sizeBytes || null,
        updatedAt: new Date(current.updatedAt).toISOString(),
      }}
    />
  );
}
