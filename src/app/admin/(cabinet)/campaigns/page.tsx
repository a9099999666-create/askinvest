import { desc } from "drizzle-orm";
import { CampaignPanel } from "@/components/admin/CampaignPanel";
import { db } from "@/db/client";
import { campaigns, subscriptionTopics } from "@/db/schema";
import { requirePageAccess } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  await requirePageAccess("campaigns");
  const topics = await db.select().from(subscriptionTopics);
  const rows = await db.select().from(campaigns).orderBy(desc(campaigns.createdAt));

  return (
    <div>
      <h1 className="mb-4 font-display text-3xl font-bold">Рассылки</h1>
      <CampaignPanel
        topics={topics.map((t) => ({ id: t.id, title: t.title, slug: t.slug }))}
        campaigns={rows.map((c) => ({
          id: c.id,
          title: c.title,
          status: c.status,
          body: c.body,
        }))}
      />
    </div>
  );
}
