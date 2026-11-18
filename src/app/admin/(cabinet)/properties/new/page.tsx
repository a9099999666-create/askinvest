import { PropertyEditor } from "@/components/admin/PropertyEditor";
import { can } from "@/lib/auth/permissions";
import { getSessionUser } from "@/lib/auth/session";

export default async function NewPropertyPage() {
  const user = await getSessionUser();
  return (
    <div>
      <h1 className="mb-4 font-display text-3xl font-bold">Новый объект</h1>
      <PropertyEditor canPublish={Boolean(user && can(user, "publish"))} />
    </div>
  );
}
