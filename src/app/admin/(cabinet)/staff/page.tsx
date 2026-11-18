import { redirect } from "next/navigation";
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
      <h1 className="mb-4 font-display text-3xl font-bold">Сотрудники</h1>
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
