import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { services, serviceVersions } from "@/db/schema";
import { DiscussForm } from "@/components/forms/DiscussForm";

export const dynamic = "force-dynamic";

export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const rows = await db
    .select({
      id: services.id,
      slug: services.slug,
      title: serviceVersions.title,
      shortDescription: serviceVersions.shortDescription,
      fullDescription: serviceVersions.fullDescription,
      workItems: serviceVersions.workItems,
    })
    .from(services)
    .innerJoin(
      serviceVersions,
      eq(services.publishedVersionId, serviceVersions.id),
    )
    .where(eq(services.slug, slug))
    .limit(1);

  const service = rows[0];
  if (!service) notFound();

  return (
    <div className="grid gap-8 pt-4 md:grid-cols-2">
      <div>
        <h1 className="font-display text-4xl font-bold text-ink">
          {service.title}
        </h1>
        <p className="mt-3 text-lg text-ink/70">{service.shortDescription}</p>
        <p className="mt-4 whitespace-pre-wrap text-ink/80">
          {service.fullDescription}
        </p>
        <ol className="mt-6 space-y-2">
          {(service.workItems || []).map((item, i) => (
            <li
              key={item.id}
              className="glass-panel rounded-xl px-4 py-3 text-ink"
            >
              <span className="mr-2 font-semibold text-brand-red">
                {i + 1}.
              </span>
              {item.text}
            </li>
          ))}
        </ol>
      </div>
      <DiscussForm
        serviceId={service.id}
        sourcePage={`/services/${service.slug}`}
        title="Обсудить услугу"
      />
    </div>
  );
}
