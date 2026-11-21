import { desc } from "drizzle-orm";
import { LeadsBoard } from "@/components/admin/LeadsBoard";
import { db } from "@/db/client";
import { leads } from "@/db/schema";
import { requirePageAccess } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  await requirePageAccess("leads");
  const all = await db.select().from(leads).orderBy(desc(leads.createdAt));

  return (
    <LeadsBoard
      leads={all.map((lead) => ({
        id: lead.id,
        stage: lead.stage,
        question: lead.question,
        visitorName: lead.visitorName,
        visitorPhone: lead.visitorPhone,
        visitorEmail: lead.visitorEmail,
        serviceTitleSnapshot: lead.serviceTitleSnapshot,
        propertyTitleSnapshot: lead.propertyTitleSnapshot,
      }))}
    />
  );
}
