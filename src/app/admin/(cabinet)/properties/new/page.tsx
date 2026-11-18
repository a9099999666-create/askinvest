import { PropertyEditor } from "@/components/admin/PropertyEditor";
import { can } from "@/lib/auth/permissions";
import { getSessionUser } from "@/lib/auth/session";

export default async function NewPropertyPage() {
  const user = await getSessionUser();
  return (
    <PropertyEditor
      heading="Новый объект"
      canPublish={Boolean(user && can(user, "publish"))}
    />
  );
}
