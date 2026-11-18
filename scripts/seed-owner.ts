import { eq } from "drizzle-orm";
import { db, sql } from "../src/db/client";
import { siteSettings, subscriptionTopics, users } from "../src/db/schema";
import { hashPassword } from "../src/lib/auth/session";
import { OWNER_PERMISSIONS } from "../src/lib/auth/permissions";

async function main() {
  const email = process.env.OWNER_EMAIL || "owner@askinvest.local";
  const password = process.env.OWNER_PASSWORD || "askinvest-owner";
  const name = process.env.OWNER_NAME || "Владелец";

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (existing) {
    console.log(`Владелец уже есть: ${email}`);
  } else {
    await db.insert(users).values({
      email,
      name,
      passwordHash: await hashPassword(password),
      isOwner: true,
      isActive: true,
      permissions: OWNER_PERMISSIONS,
    });
    console.log(`Создан владелец ${email} / ${password}`);
  }

  await db
    .insert(siteSettings)
    .values({
      id: 1,
      contactsHtml:
        "<p>АСКИНВЕСТ</p><p>Связь через форму на сайте или мессенджеры.</p>",
    })
    .onConflictDoNothing();

  const topic = await db.query.subscriptionTopics.findFirst({
    where: eq(subscriptionTopics.slug, "rent"),
  });
  if (!topic) {
    await db.insert(subscriptionTopics).values({
      slug: "rent",
      title: "Аренда",
      consentText:
        "Согласие на получение информационных сообщений об аренде коммерческой недвижимости.",
      consentVersion: "1",
    });
  }

  await sql.end({ timeout: 5 });
}

main().catch(async (e) => {
  console.error(e);
  await sql.end({ timeout: 5 });
  process.exit(1);
});
