import { ServiceEditor } from "@/components/admin/ServiceEditor";
import { can } from "@/lib/auth/permissions";
import { getSessionUser } from "@/lib/auth/session";

export default async function NewServicePage() {
  const user = await getSessionUser();
  return (
    <ServiceEditor
      heading="Новая услуга"
      canPublish={Boolean(user && can(user, "publish"))}
    />
  );
}
