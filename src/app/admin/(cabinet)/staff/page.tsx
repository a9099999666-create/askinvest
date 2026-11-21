import { redirect } from "next/navigation";
import { PageTitle } from "@/components/admin/PageTitle";
import { StaffPanel } from "@/components/admin/StaffPanel";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const me = await getSessionUser();
  if (!me?.isOwner) redirect("/admin/properties");
  const staff = await db.select().from(users);

  return (
    <div>
      <PageTitle className="mb-4" title="Сотрудники" />
      <StaffPanel
        staff={staff.map((s) => ({
          id: s.id,
          email: s.email,
          name: s.name,
          isOwner: s.isOwner,
          isActive: s.isActive,
          permissions: s.permissions,
        }))}
      />
    </div>
  );
}
