import { eq, ilike, or } from "drizzle-orm";
import { db, sql } from "../src/db/client";
import {
  properties,
  propertyVersions,
  services,
  serviceVersions,
  siteSettings,
} from "../src/db/schema";

const verbs: Record<string, { text: string; icon: "doc" | "pen" | "handshake" }[]> = {
  "yuridicheskoe-soprovozhdenie": [
    { text: "Проверим документы", icon: "doc" },
    { text: "Подготовим договор", icon: "pen" },
    { text: "Сопроводим сделку", icon: "handshake" },
  ],
  "soprovozhdenie-sdelok": [
    { text: "Проведём переговоры", icon: "handshake" },
    { text: "Соберём структуру сделки", icon: "doc" },
    { text: "Зарегистрируем переход", icon: "pen" },
  ],
  "drugie-uslugi": [
    { text: "Разберём задачу", icon: "doc" },
    { text: "Предложим путь", icon: "pen" },
    { text: "Согласуем порядок работ", icon: "handshake" },
  ],
};

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

  const published = await db.query.services.findMany();
  const featured = published
    .filter((row) =>
      ["yuridicheskoe-soprovozhdenie", "soprovozhdenie-sdelok"].includes(row.slug),
    )
    .filter((row) => row.publishedVersionId)
    .map((row) => row.id);

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
      homeServiceIds: featured.slice(0, 2),
      updatedAt: new Date(),
    })
    .where(eq(siteSettings.id, 1));

  console.log("Контент обновлён: глаголы услуг и часы работы");
  await sql.end({ timeout: 5 });
}

main().catch(async (e) => {
  console.error(e);
  await sql.end({ timeout: 5 });
  process.exit(1);
});
