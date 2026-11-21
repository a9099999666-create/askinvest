import { ContentBoard } from "@/components/admin/ContentBoard";
import { can } from "@/lib/auth/permissions";
import { requirePageAccess } from "@/lib/auth/guard";
import { loadMaterials } from "@/lib/content/materials";

export const dynamic = "force-dynamic";

export default async function AdminPropertiesPage() {
  const user = await requirePageAccess();
  const items = await loadMaterials();
  return (
    <ContentBoard
      items={items}
      initialTab="properties"
      canEdit={can(user, "editContent")}
    />
  );
}
