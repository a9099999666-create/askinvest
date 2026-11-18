import { unstable_cache } from "next/cache";
import { and, asc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { properties, propertyVersions, services, serviceVersions, siteSettings } from "@/db/schema";

const options = { revalidate: 60 };

const areaBands: Record<string, { min?: string; max?: string }> = {
  "100": { max: "100" },
  "300": { min: "100", max: "300" },
  "1000": { min: "300", max: "1000" },
  "1000p": { min: "1000" },
};

export const getHomeServices = unstable_cache(
  async () =>
    db
      .select({
        id: services.id,
        slug: services.slug,
        title: serviceVersions.title,
      })
      .from(services)
      .innerJoin(serviceVersions, eq(services.publishedVersionId, serviceVersions.id))
      .orderBy(asc(services.sortOrder)),
  ["home-services"],
  options,
);

export const getServiceCards = unstable_cache(
  async () =>
    db
      .select({
        id: services.id,
        slug: services.slug,
        title: serviceVersions.title,
        shortDescription: serviceVersions.shortDescription,
      })
      .from(services)
      .innerJoin(serviceVersions, eq(services.publishedVersionId, serviceVersions.id))
      .orderBy(asc(services.sortOrder)),
  ["service-cards"],
  options,
);

export const getPublishedService = unstable_cache(
  async (slug: string) => {
    const rows = await db
      .select({
        id: services.id,
        slug: services.slug,
        title: serviceVersions.title,
        shortDescription: serviceVersions.shortDescription,
        workItems: serviceVersions.workItems,
      })
      .from(services)
      .innerJoin(serviceVersions, eq(services.publishedVersionId, serviceVersions.id))
      .where(eq(services.slug, slug))
      .limit(1);
    return rows[0] ?? null;
  },
  ["published-service"],
  options,
);

export const getPropertyCards = unstable_cache(
  async (deal: string, q: string, area: string) => {
    const band = areaBands[area];
    const conditions = [eq(propertyVersions.status, "published")];
    if (deal === "sale" || deal === "rent") {
      conditions.push(eq(propertyVersions.dealType, deal));
    }
    if (q) conditions.push(sql`${propertyVersions.address} ilike ${"%" + q + "%"}`);
    if (band?.min) conditions.push(gte(propertyVersions.areaSqm, band.min));
    if (band?.max) conditions.push(lte(propertyVersions.areaSqm, band.max));
    return db
      .select({
        id: properties.id,
        slug: properties.slug,
        address: propertyVersions.address,
        dealType: propertyVersions.dealType,
        coverId: propertyVersions.coverId,
      })
      .from(properties)
      .innerJoin(propertyVersions, eq(properties.publishedVersionId, propertyVersions.id))
      .where(and(...conditions));
  },
  ["property-cards"],
  options,
);

export const getPublishedProperty = unstable_cache(
  async (slug: string) => {
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
        coverId: propertyVersions.coverId,
        galleryIds: propertyVersions.galleryIds,
        floorPlanId: propertyVersions.floorPlanId,
      })
      .from(properties)
      .innerJoin(propertyVersions, eq(properties.publishedVersionId, propertyVersions.id))
      .where(eq(properties.slug, slug))
      .limit(1);
    return rows[0] ?? null;
  },
  ["published-property"],
  options,
);

export const getContactsHtml = unstable_cache(async () => {
  const settings = await db.query.siteSettings.findFirst({
    where: eq(siteSettings.id, 1),
  });
  return settings?.contactsHtml || "";
}, ["contacts-html"], options);
