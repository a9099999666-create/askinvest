import { eq } from "drizzle-orm";
import { db, sql } from "../src/db/client";
import { users } from "../src/db/schema";
import { seedStarterCatalog } from "../src/lib/content/seed-catalog";

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

  await seedStarterCatalog(owner.id);
  console.log("Демо-услуги и объекты опубликованы");
  await sql.end({ timeout: 5 });
}

main().catch(async (e) => {
  console.error(e);
  await sql.end({ timeout: 5 });
  process.exit(1);
});
