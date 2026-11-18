import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { properties, propertyVersions } from "@/db/schema";
import { DiscussForm } from "@/components/forms/DiscussForm";
import { formatArea, formatRub } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PropertyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const rows = await db
    .select({
      id: properties.id,
      slug: properties.slug,
      title: propertyVersions.title,
      address: propertyVersions.address,
      dealType: propertyVersions.dealType,
      areaSqm: propertyVersions.areaSqm,
      priceRub: propertyVersions.priceRub,
      priceUnit: propertyVersions.priceUnit,
      description: propertyVersions.description,
      floorPlanId: propertyVersions.floorPlanId,
    })
    .from(properties)
    .innerJoin(
      propertyVersions,
      eq(properties.publishedVersionId, propertyVersions.id),
    )
    .where(eq(properties.slug, slug))
    .limit(1);

  const property = rows[0];
  if (!property) notFound();

  return (
    <div className="grid gap-8 pt-4 md:grid-cols-2">
      <div>
        <div
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold text-white ${
            property.dealType === "sale" ? "bg-brand-red" : "bg-brand-blue"
          }`}
        >
          {property.dealType === "sale" ? "Продажа" : "Аренда"}
        </div>
        <h1 className="mt-3 font-display text-4xl font-bold text-ink">
          {property.title}
        </h1>
        <p className="mt-2 text-lg text-ink/70">{property.address}</p>
        <div className="mt-4 flex flex-wrap gap-4 text-ink">
          <span>{formatArea(property.areaSqm)}</span>
          <span className="font-semibold">
            {formatRub(property.priceRub, property.priceUnit)}
          </span>
        </div>
        <p className="mt-6 whitespace-pre-wrap text-ink/80">
          {property.description}
        </p>
        {property.floorPlanId && (
          <Link
            href={`/api/media/${property.floorPlanId}`}
            className="btn-ghost mt-4"
          >
            Планировка
          </Link>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="#ask" className="btn-primary">
            Задать вопрос
          </a>
          <a href="#viewing" className="btn-ghost">
            Записаться на просмотр
          </a>
        </div>
      </div>
      <div className="space-y-6">
        <div id="ask">
          <DiscussForm
            propertyId={property.id}
            intent="question"
            sourcePage={`/properties/${property.slug}`}
            title="Задать вопрос"
          />
        </div>
        <div id="viewing">
          <DiscussForm
            propertyId={property.id}
            intent="viewing"
            sourcePage={`/properties/${property.slug}`}
            title="Записаться на просмотр"
          />
        </div>
      </div>
    </div>
  );
}
