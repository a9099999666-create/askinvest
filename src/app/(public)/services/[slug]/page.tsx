import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { services, serviceVersions } from "@/db/schema";
import { DiscussForm } from "@/components/forms/DiscussForm";
import { GlassFolder } from "@/components/public/GlassFolder";

export const dynamic = "force-dynamic";

const icons = ["doc", "pen", "hands"] as const;

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
    <div className="pt-2">
      <p className="text-sm text-ink/50">
        <Link href="/services" className="hover:text-ink">
          Услуги
        </Link>
        <span className="mx-2">›</span>
        {service.title}
      </p>
      <div className="mt-4 grid items-start gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <div className="grid items-end gap-4 md:grid-cols-[1fr_220px]">
            <div>
              <h1 className="font-display text-4xl font-bold leading-tight text-ink md:text-5xl">
                {service.title}
              </h1>
              <div className="mt-4 h-[3px] w-16 rounded bg-brand-red" />
            </div>
            <GlassFolder />
          </div>
          <div className="glass-panel mt-6 rounded-[28px] p-5 md:p-6">
            <h2 className="text-xl font-bold text-ink">Чем поможем:</h2>
            <ul className="mt-4 space-y-3">
              {(service.workItems || []).map((item, i) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-2xl border border-white bg-white/70 px-4 py-3"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-sky-50 text-ink/70">
                    {icons[i % icons.length] === "doc" && "📄"}
                    {icons[i % icons.length] === "pen" && "✎"}
                    {icons[i % icons.length] === "hands" && "🤝"}
                  </span>
                  <span className="flex-1 font-medium text-ink">{item.text}</span>
                  <span className="text-brand-red">→</span>
                </li>
              ))}
            </ul>
            {service.shortDescription && (
              <p className="mt-4 text-sm text-ink/60">{service.shortDescription}</p>
            )}
          </div>
        </div>
        <DiscussForm
          serviceId={service.id}
          sourcePage={`/services/${service.slug}`}
          title="Обсудить задачу"
        />
      </div>
    </div>
  );
}
