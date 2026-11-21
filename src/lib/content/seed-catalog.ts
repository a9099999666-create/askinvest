import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  properties,
  propertyVersions,
  services,
  serviceVersions,
  siteSettings,
  subscriptionTopics,
} from "@/db/schema";
import { DEMO_PROPERTIES, DEMO_SERVICES } from "@/lib/content/demo-catalog";
import { revalidatePublic } from "@/lib/public/revalidate";

export async function seedStarterCatalog(ownerId: string) {
  const topic = await db.query.subscriptionTopics.findFirst();
  if (!topic) {
    await db.insert(subscriptionTopics).values({
      slug: "rent",
      title: "Аренда",
      consentText:
        "Согласие на получение информационных сообщений об аренде коммерческой недвижимости.",
      consentVersion: "1",
    });
  }

  const featuredIds: string[] = [];
  let order = 1;
  for (const demo of DEMO_SERVICES) {
    const existing = await db.query.services.findFirst({
      where: eq(services.slug, demo.slug),
    });
    if (existing) {
      featuredIds.push(existing.id);
      continue;
    }
    const [service] = await db
      .insert(services)
      .values({ slug: demo.slug, sortOrder: order++ })
      .returning();
    const [version] = await db
      .insert(serviceVersions)
      .values({
        serviceId: service.id,
        status: "published",
        title: demo.title,
        shortDescription: demo.shortDescription,
        fullDescription: demo.fullDescription,
        workItems: demo.workItems,
        version: 1,
        createdById: ownerId,
        publishedById: ownerId,
        publishedAt: new Date(),
      })
      .returning();
    await db
      .update(services)
      .set({ publishedVersionId: version.id })
      .where(eq(services.id, service.id));
    featuredIds.push(service.id);
  }

  for (const demo of DEMO_PROPERTIES) {
    const existing = await db.query.properties.findFirst({
      where: eq(properties.slug, demo.slug),
    });
    if (existing) continue;
    const [property] = await db
      .insert(properties)
      .values({ slug: demo.slug })
      .returning();
    const [version] = await db
      .insert(propertyVersions)
      .values({
        propertyId: property.id,
        status: "published",
        title: demo.title,
        address: demo.address,
        dealType: demo.dealType,
        placeKind: demo.placeKind,
        areaSqm: demo.areaSqm,
        priceRub: demo.priceRub,
        priceUnit: demo.priceUnit,
        description: demo.description,
        version: 1,
        createdById: ownerId,
        publishedById: ownerId,
        publishedAt: new Date(),
      })
      .returning();
    await db
      .update(properties)
      .set({ publishedVersionId: version.id })
      .where(eq(properties.id, property.id));
  }

  const hours = "Пн–Пт 10:00–19:00 по Москве";
  const contactsHtml = "<p>АСКИНВЕСТ</p><p>Москва. Заявка через форму на сайте.</p>";
  await db
    .insert(siteSettings)
    .values({
      id: 1,
      contactsHtml,
      contactHours: hours,
      homeServiceIds: featuredIds.slice(0, 2),
    })
    .onConflictDoUpdate({
      target: siteSettings.id,
      set: {
        homeServiceIds: featuredIds.slice(0, 2),
        contactHours: hours,
        contactsHtml,
        updatedAt: new Date(),
      },
    });

  revalidatePublic();
}
