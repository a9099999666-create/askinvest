DO $$ BEGIN
  CREATE TYPE "place_kind" AS ENUM ('office', 'warehouse', 'retail', 'production', 'other');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "property_versions"
  ADD COLUMN IF NOT EXISTS "place_kind" "place_kind" NOT NULL DEFAULT 'other';

UPDATE "property_versions" SET "place_kind" = 'office' WHERE title ILIKE '%офис%';
UPDATE "property_versions" SET "place_kind" = 'warehouse' WHERE title ILIKE '%склад%';
UPDATE "property_versions" SET "place_kind" = 'retail' WHERE title ILIKE '%торг%';
UPDATE "property_versions" SET "place_kind" = 'production' WHERE title ILIKE '%производ%';

ALTER TABLE "site_settings"
  ADD COLUMN IF NOT EXISTS "contact_phone" varchar(64) NOT NULL DEFAULT '';
ALTER TABLE "site_settings"
  ADD COLUMN IF NOT EXISTS "contact_address" varchar(500) NOT NULL DEFAULT '';
ALTER TABLE "site_settings"
  ADD COLUMN IF NOT EXISTS "contact_hours" varchar(255) NOT NULL DEFAULT '';

UPDATE "site_settings"
SET "contact_hours" = CASE
  WHEN "contact_hours" = '' THEN 'Пн–Пт 10:00–19:00 по Москве'
  ELSE "contact_hours"
END
WHERE id = 1;

UPDATE "services" AS s
SET "published_version_id" = NULL
FROM "service_versions" AS v
WHERE s.published_version_id = v.id
  AND (v.title ~ '\d{10,}' OR v.title ILIKE '%черновик%');
