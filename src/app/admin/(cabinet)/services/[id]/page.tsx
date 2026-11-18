import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { ServiceEditor } from "@/components/admin/ServiceEditor";
import { db } from "@/db/client";
import { serviceVersions } from "@/db/schema";
import { can } from "@/lib/auth/permissions";
import { getSessionUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();
  const rows = await db
    .select()
    .from(serviceVersions)
    .where(eq(serviceVersions.serviceId, id))
    .orderBy(desc(serviceVersions.version));
  const current = rows[0];
  if (!current) notFound();

  return (
    <div>
      <h1 className="mb-4 font-display text-3xl font-bold">Редактор услуги</h1>
      <ServiceEditor
        serviceId={id}
        canPublish={Boolean(user && can(user, "publish"))}
        initial={{
          title: current.title,
          shortDescription: current.shortDescription,
          fullDescription: current.fullDescription,
          workItems: current.workItems || [],
          updatedAt: new Date(current.updatedAt).toISOString(),
          status: current.status,
        }}
      />
    </div>
  );
}
