ALTER TABLE IF EXISTS "media_assets" ADD COLUMN IF NOT EXISTS "content" bytea;
ALTER TABLE IF EXISTS "contacts" ADD COLUMN IF NOT EXISTS "email" varchar(255);
ALTER TABLE IF EXISTS "leads" ADD COLUMN IF NOT EXISTS "visitor_email" varchar(255);
ALTER TABLE IF EXISTS "site_settings" ADD COLUMN IF NOT EXISTS "contacts_html" text NOT NULL DEFAULT '';
ALTER TABLE IF EXISTS "site_settings" ADD COLUMN IF NOT EXISTS "home_service_ids" jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS "site_settings" ADD COLUMN IF NOT EXISTS "contact_phone" varchar(64) NOT NULL DEFAULT '';
ALTER TABLE IF EXISTS "site_settings" ADD COLUMN IF NOT EXISTS "contact_address" varchar(500) NOT NULL DEFAULT '';
ALTER TABLE IF EXISTS "site_settings" ADD COLUMN IF NOT EXISTS "contact_hours" varchar(255) NOT NULL DEFAULT '';
ALTER TABLE IF EXISTS "users" ADD COLUMN IF NOT EXISTS "password_hash" text NOT NULL DEFAULT '';
ALTER TABLE IF EXISTS "users" ADD COLUMN IF NOT EXISTS "name" varchar(255) NOT NULL DEFAULT '';
ALTER TABLE IF EXISTS "users" ADD COLUMN IF NOT EXISTS "is_owner" boolean NOT NULL DEFAULT false;
ALTER TABLE IF EXISTS "users" ADD COLUMN IF NOT EXISTS "is_active" boolean NOT NULL DEFAULT true;
ALTER TABLE IF EXISTS "users" ADD COLUMN IF NOT EXISTS "permissions" jsonb NOT NULL DEFAULT '{"editContent":false,"publish":false,"leads":false,"contacts":false,"campaigns":false}'::jsonb;

DO $$ BEGIN
  ALTER TABLE IF EXISTS "property_versions"
    ADD COLUMN IF NOT EXISTS "place_kind" "place_kind" NOT NULL DEFAULT 'other';
EXCEPTION
  WHEN undefined_object THEN NULL;
  WHEN duplicate_column THEN NULL;
END $$;
