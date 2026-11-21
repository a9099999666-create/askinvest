import { PropertyEditor } from "@/components/admin/PropertyEditor";
import { can } from "@/lib/auth/permissions";
import { requirePageAccess } from "@/lib/auth/guard";

export default async function NewPropertyPage() {
  const user = await requirePageAccess("editContent");
  return (
    <PropertyEditor
      heading="Новый объект"
      canPublish={can(user, "publish")}
    />
  );
}
