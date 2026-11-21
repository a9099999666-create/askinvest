import { count } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, hasDatabase } from "@/db/client";
import { ensureSchema } from "@/db/ensure-schema";
import { users } from "@/db/schema";
import { AdminSetupForm } from "./setup-form";

export const dynamic = "force-dynamic";

export default async function AdminSetupPage() {
  if (hasDatabase()) {
    try {
      await ensureSchema();
    } catch {
      return <AdminSetupForm />;
    }
    const [{ value }] = await db.select({ value: count() }).from(users);
    if (Number(value) > 0) redirect("/cabinet/login");
  }
  return <AdminSetupForm />;
}
