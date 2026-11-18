import { ContentBoard } from "@/components/admin/ContentBoard";
import { loadMaterials } from "@/lib/content/materials";

export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  const items = await loadMaterials();
  return <ContentBoard items={items} initialTab="services" />;
}
