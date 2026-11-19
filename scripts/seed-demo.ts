import { eq } from "drizzle-orm";
import { db, sql } from "../src/db/client";
import {
  properties,
  propertyVersions,
  services,
  serviceVersions,
  users,
} from "../src/db/schema";

async function main() {
  if (process.env.ALLOW_DEMO_SEED !== "true") {
    console.error("Установите ALLOW_DEMO_SEED=true для демо-данных");
    process.exit(1);
  }

  const owner = await db.query.users.findFirst({
    where: eq(users.isOwner, true),
  });
  if (!owner) {
    console.error("Сначала создайте владельца: npm run seed:owner");
    process.exit(1);
  }

  const existing = await db.query.services.findFirst({
    where: eq(services.slug, "yuridicheskoe-soprovozhdenie"),
  });
  if (existing) {
    console.log("Демо уже загружено");
    await sql.end({ timeout: 5 });
    return;
  }

  const demos = [
    {
      slug: "yuridicheskoe-soprovozhdenie",
      title: "Юридическое сопровождение",
      short: "Договоры, проверка контрагентов, сопровождение сделок.",
      items: [
        { text: "Проверим документы", icon: "doc" as const },
        { text: "Подготовим договор", icon: "pen" as const },
        { text: "Сопроводим сделку", icon: "handshake" as const },
      ],
    },
    {
      slug: "soprovozhdenie-sdelok",
      title: "Сопровождение сделок",
      short: "От переговоров до регистрации.",
      items: [
        { text: "Проведём переговоры", icon: "handshake" as const },
        { text: "Соберём структуру сделки", icon: "doc" as const },
        { text: "Зарегистрируем переход", icon: "pen" as const },
      ],
    },
    {
      slug: "drugie-uslugi",
      title: "Другие услуги",
      short: "Консультации и отраслевые решения для бизнеса.",
      items: [
        { text: "Разберём задачу", icon: "doc" as const },
        { text: "Предложим путь", icon: "pen" as const },
        { text: "Согласуем порядок работ", icon: "handshake" as const },
      ],
    },
  ];

  let order = 1;
  for (const d of demos) {
    const [service] = await db
      .insert(services)
      .values({ slug: d.slug, sortOrder: order++ })
      .returning();
    const [version] = await db
      .insert(serviceVersions)
      .values({
        serviceId: service.id,
        status: "published",
        title: d.title,
        shortDescription: d.short,
        fullDescription: d.short,
        workItems: d.items.map((item, i) => ({ id: `w${i}`, ...item })),
        version: 1,
        createdById: owner.id,
        publishedById: owner.id,
        publishedAt: new Date(),
      })
      .returning();
    await db
      .update(services)
      .set({ publishedVersionId: version.id })
      .where(eq(services.id, service.id));
  }

  const props = [
    {
      slug: "ulitsa-brusilova-27",
      title: "Офисное помещение",
      address: "Улица Брусилова, 27",
      dealType: "sale" as const,
      placeKind: "office" as const,
      area: "215",
      price: "45000000",
      unit: "total" as const,
    },
    {
      slug: "schelkovskoe-shosse",
      title: "Склад класса A",
      address: "Щёлковское шоссе",
      dealType: "rent" as const,
      placeKind: "warehouse" as const,
      area: "1200",
      price: "1200000",
      unit: "per_month" as const,
    },
  ];

  for (const p of props) {
    const [property] = await db
      .insert(properties)
      .values({ slug: p.slug })
      .returning();
    const [version] = await db
      .insert(propertyVersions)
      .values({
        propertyId: property.id,
        status: "published",
        title: p.title,
        address: p.address,
        dealType: p.dealType,
        placeKind: p.placeKind,
        areaSqm: p.area,
        priceRub: p.price,
        priceUnit: p.unit,
        description: "Демо-объект для локальной проверки каталога.",
        version: 1,
        createdById: owner.id,
        publishedById: owner.id,
        publishedAt: new Date(),
      })
      .returning();
    await db
      .update(properties)
      .set({ publishedVersionId: version.id })
      .where(eq(properties.id, property.id));
  }

  console.log("Демо-услуги и объекты опубликованы");
  await sql.end({ timeout: 5 });
}

main().catch(async (e) => {
  console.error(e);
  await sql.end({ timeout: 5 });
  process.exit(1);
});
