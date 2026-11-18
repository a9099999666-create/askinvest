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
  return (
    <AdminShell
      userName={`${user.name} · ${user.isOwner ? "Владелец" : "Сотрудник"}`}
      isOwner={user.isOwner}
    >
      {children}
    </AdminShell>
  );
}
