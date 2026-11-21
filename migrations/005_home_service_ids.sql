ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "home_service_ids" jsonb NOT NULL DEFAULT '[]'::jsonb;
