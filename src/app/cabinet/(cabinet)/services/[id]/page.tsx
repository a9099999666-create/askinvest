import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ServiceEditor } from "@/components/admin/ServiceEditor";
import { db } from "@/db/client";
import { services } from "@/db/schema";
import { can } from "@/lib/auth/permissions";
import { requirePageAccess } from "@/lib/auth/guard";
import { getEditableServiceVersion } from "@/lib/crm/content";

export const dynamic = "force-dynamic";

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePageAccess("editContent");
  const { id } = await params;
  const service = await db.query.services.findFirst({
    where: eq(services.id, id),
  });
  const current = await getEditableServiceVersion(id);
  if (!service || !current) notFound();

  return (
    <ServiceEditor
      serviceId={id}
      heading="Редактирование услуги"
      canPublish={can(user, "publish")}
      initial={{
        title: current.title,
        slug: service.slug,
        shortDescription: current.shortDescription,
        fullDescription: current.fullDescription,
        workItems: current.workItems || [],
        imageId: current.imageId,
        sortOrder: service.sortOrder,
        updatedAt: new Date(current.updatedAt).toISOString(),
        status: current.status,
        published: Boolean(service.publishedVersionId),
      }}
    />
  );
}
