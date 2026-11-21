import { ServiceEditor } from "@/components/admin/ServiceEditor";
import { can } from "@/lib/auth/permissions";
import { requirePageAccess } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

export default async function NewServicePage() {
  const user = await requirePageAccess("editContent");
  return (
    <ServiceEditor
      heading="Новая услуга"
      canPublish={can(user, "publish")}
    />
  );
}
