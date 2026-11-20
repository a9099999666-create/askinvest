import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { getSessionUser } from "@/lib/auth/session";

export default async function CabinetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  const role = user.isOwner ? "Владелец" : "Сотрудник";
  const userName = user.name === role ? user.name : `${user.name} · ${role}`;
  return (
    <AdminShell
      userName={userName}
      isOwner={user.isOwner}
    >
      {children}
    </AdminShell>
  );
}
