import { ServiceEditor } from "@/components/admin/ServiceEditor";
import { can } from "@/lib/auth/permissions";
import { getSessionUser } from "@/lib/auth/session";

export default async function NewServicePage() {
  const user = await getSessionUser();
  return (
    <div>
      <h1 className="mb-4 font-display text-3xl font-bold">Новая услуга</h1>
      <ServiceEditor canPublish={Boolean(user && can(user, "publish"))} />
    </div>
  );
}
