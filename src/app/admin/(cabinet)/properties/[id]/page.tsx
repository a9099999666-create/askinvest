import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { PropertyEditor } from "@/components/admin/PropertyEditor";
import { db } from "@/db/client";
import { propertyVersions } from "@/db/schema";
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

  return (
    <div>
      <h1 className="mb-4 font-display text-3xl font-bold">Редактор объекта</h1>
      <PropertyEditor
        propertyId={id}
        canPublish={Boolean(user && can(user, "publish"))}
        initial={{
          title: current.title,
          address: current.address,
          dealType: current.dealType,
          areaSqm: String(current.areaSqm),
          priceRub: String(current.priceRub),
          priceUnit: current.priceUnit,
          description: current.description,
          coverId: current.coverId,
          galleryIds: current.galleryIds || [],
          floorPlanId: current.floorPlanId,
          updatedAt: new Date(current.updatedAt).toISOString(),
        }}
      />
    </div>
  );
}
