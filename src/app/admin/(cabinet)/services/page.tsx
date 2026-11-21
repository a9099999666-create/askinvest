import { ContentBoard } from "@/components/admin/ContentBoard";
import { HomeFeatured } from "@/components/admin/HomeFeatured";
import { can } from "@/lib/auth/permissions";
import { requirePageAccess } from "@/lib/auth/guard";
import { loadMaterials } from "@/lib/content/materials";
import {
  getHomeFeaturedIds,
  listPublishedServices,
} from "@/lib/crm/content";

export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  const user = await requirePageAccess("editContent");
  const [items, published, featured] = await Promise.all([
    loadMaterials(),
    listPublishedServices(),
    getHomeFeaturedIds(),
  ]);
  return (
    <>
      <ContentBoard items={items} initialTab="services" canEdit={can(user, "editContent")} />
      {can(user, "publish") ? (
        <HomeFeatured options={published} initialIds={featured} />
      ) : null}
    </>
  );
}
