import { eq, ilike, or } from "drizzle-orm";
import { db, sql } from "../src/db/client";
import {
  properties,
  propertyVersions,
  services,
  serviceVersions,
  siteSettings,
  users,
} from "../src/db/schema";

const verbs: Record<string, { text: string; icon: "doc" | "pen" | "handshake" }[]> = {
  "yuridicheskoe-soprovozhdenie": [
    { text: "Проверим документы", icon: "doc" },
    { text: "Подготовим договор", icon: "pen" },
    { text: "Сопроводим сделку", icon: "handshake" },
  ],
  "soprovozhdenie-sdelok": [
    { text: "Проверим документы", icon: "doc" },
    { text: "Подготовим договор", icon: "pen" },
    { text: "Согласуем порядок сделки", icon: "handshake" },
  ],
};

const hideSlugs = ["drugie-uslugi", "priemka-soprovozhdenie"];

async function main() {
  for (const [slug, items] of Object.entries(verbs)) {
    const service = await db.query.services.findFirst({
      where: eq(services.slug, slug),
    });
    if (!service?.publishedVersionId) continue;
    await db
      .update(serviceVersions)
      .set({
        workItems: items.map((item, i) => ({ id: `w${i}`, ...item })),
        updatedAt: new Date(),
      })
      .where(eq(serviceVersions.id, service.publishedVersionId));
  }

  const allServices = await db.query.services.findMany();
  for (const row of allServices) {
    const hide =
      hideSlugs.includes(row.slug) ||
      /proverka-kabineta|priemka/i.test(row.slug);
    if (hide && row.publishedVersionId) {
      await db
        .update(services)
        .set({ publishedVersionId: null, updatedAt: new Date() })
        .where(eq(services.id, row.id));
    }
  }

  const featured = allServices
    .filter((row) =>
      ["yuridicheskoe-soprovozhdenie", "soprovozhdenie-sdelok"].includes(row.slug),
    )
    .map((row) => row.id);

  const owner = await db.query.users.findFirst({
    where: eq(users.isOwner, true),
  });

  let third = await db.query.properties.findFirst({
    where: eq(properties.slug, "starobitsevskaya-ulitsa"),
  });
  const leftover = await db.query.properties.findFirst({
    where: eq(properties.slug, "testovaya-ul-1"),
  });
  if (!third && leftover) {
    await db
      .update(properties)
      .set({ slug: "starobitsevskaya-ulitsa", updatedAt: new Date() })
      .where(eq(properties.id, leftover.id));
    third = await db.query.properties.findFirst({
      where: eq(properties.id, leftover.id),
    });
  }
  if (!third && owner) {
    const [created] = await db
      .insert(properties)
      .values({ slug: "starobitsevskaya-ulitsa" })
      .returning();
    third = created;
  }
  if (third && owner && !third.publishedVersionId) {
    const existingVersion = await db.query.propertyVersions.findFirst({
      where: eq(propertyVersions.propertyId, third.id),
    });
    const payload = {
      status: "published" as const,
      title: "Офис на Старобитцевской",
      address: "Старобитцевская улица",
      dealType: "sale" as const,
      placeKind: "office" as const,
      areaSqm: "186",
      priceRub: "38500000",
      priceUnit: "total" as const,
      description: "Светлый офис с переговорной и отдельным входом.",
      publishedById: owner.id,
      publishedAt: new Date(),
      updatedAt: new Date(),
    };
    const version = existingVersion
      ? (
          await db
            .update(propertyVersions)
            .set(payload)
            .where(eq(propertyVersions.id, existingVersion.id))
            .returning()
        )[0]
      : (
          await db
            .insert(propertyVersions)
            .values({
              propertyId: third.id,
              version: 1,
              createdById: owner.id,
              ...payload,
            })
            .returning()
        )[0];
    await db
      .update(properties)
      .set({ publishedVersionId: version.id, updatedAt: new Date() })
      .where(eq(properties.id, third.id));
  }

  const testProps = await db
    .select({ id: properties.id })
    .from(properties)
    .innerJoin(propertyVersions, eq(properties.publishedVersionId, propertyVersions.id))
    .where(
      or(
        ilike(propertyVersions.address, "%тестов%"),
        ilike(propertyVersions.title, "%тест%"),
      ),
    );
  for (const row of testProps) {
    await db
      .update(properties)
      .set({ publishedVersionId: null, updatedAt: new Date() })
      .where(eq(properties.id, row.id));
  }

  await db
    .update(siteSettings)
    .set({
      contactHours: "Пн–Пт 10:00–19:00 по Москве",
      contactsHtml: "",
      homeServiceIds: featured.slice(0, 2),
      updatedAt: new Date(),
    })
    .where(eq(siteSettings.id, 1));

  console.log("Контент выровнен: услуги, объекты и контакты");
  await sql.end({ timeout: 5 });
}

main().catch(async (e) => {
  console.error(e);
  await sql.end({ timeout: 5 });
  process.exit(1);
});
