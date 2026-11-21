import { redirect } from "next/navigation";
import { can, type Permissions } from "@/lib/auth/permissions";
import { getSessionUser } from "@/lib/auth/session";

export async function requirePageAccess(permission?: keyof Permissions) {
  const user = await getSessionUser();
  if (!user) redirect("/cabinet/login");
  if (permission && !can(user, permission)) {
    redirect("/cabinet/properties");
  }
  return user;
}
