CREATE TYPE "public"."campaign_status" AS ENUM('draft', 'ready', 'running', 'paused', 'done', 'cancelled');
CREATE TYPE "public"."channel" AS ENUM('telegram', 'max', 'whatsapp', 'test');
CREATE TYPE "public"."chat_link_status" AS ENUM('not_started', 'linked', 'unlinked_inbound');
CREATE TYPE "public"."deal_type" AS ENUM('sale', 'rent');
CREATE TYPE "public"."job_status" AS ENUM('pending', 'processing', 'done', 'failed', 'cancelled');
CREATE TYPE "public"."lead_stage" AS ENUM('new', 'in_progress', 'done');
CREATE TYPE "public"."message_author" AS ENUM('client', 'bot', 'staff', 'system');
CREATE TYPE "public"."message_status" AS ENUM('queued', 'sent', 'accepted', 'delivered', 'failed', 'cancelled');
CREATE TYPE "public"."price_unit" AS ENUM('total', 'per_month');
CREATE TYPE "public"."publish_status" AS ENUM('draft', 'review', 'published', 'archived');
CREATE TYPE "public"."thread_mode" AS ENUM('bot', 'human');
CREATE TABLE "campaign_recipients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"channel" "channel" NOT NULL,
	"status" "message_status" DEFAULT 'queued' NOT NULL,
	"error" text,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"topic_id" uuid,
	"channel" "channel",
	"status" "campaign_status" DEFAULT 'draft' NOT NULL,
	"attachment_id" uuid,
	"created_by_id" uuid,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "channel_identities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" uuid NOT NULL,
	"channel" "channel" NOT NULL,
	"external_id" varchar(255) NOT NULL,
	"meta" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"display_name" varchar(255),
	"phone" varchar(64),
	"notes" text DEFAULT '',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"token_hash" text NOT NULL,
	"permissions" jsonb NOT NULL,
	"invited_by_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invitations_token_hash_unique" UNIQUE("token_hash")
);

CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(120) NOT NULL,
	"payload" jsonb NOT NULL,
	"status" "job_status" DEFAULT 'pending' NOT NULL,
	"run_after" timestamp with time zone DEFAULT now() NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"idempotency_key" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "lead_markers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"channel" "channel" NOT NULL,
	"code" varchar(32) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lead_markers_code_unique" UNIQUE("code")
);

CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_key" varchar(64) NOT NULL,
	"stage" "lead_stage" DEFAULT 'new' NOT NULL,
	"channel" "channel" NOT NULL,
	"question" text NOT NULL,
	"visitor_name" varchar(255),
	"visitor_phone" varchar(64),
	"source_page" varchar(500),
	"intent" varchar(64) DEFAULT 'discuss',
	"service_id" uuid,
	"property_id" uuid,
	"service_title_snapshot" varchar(255),
	"property_title_snapshot" varchar(255),
	"contact_id" uuid,
	"assignee_id" uuid,
	"note" text DEFAULT '',
	"next_action" text DEFAULT '',
	"next_action_at" timestamp with time zone,
	"chat_link_status" "chat_link_status" DEFAULT 'not_started' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "leads_public_key_unique" UNIQUE("public_key")
);

CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"storage_key" text NOT NULL,
	"mime_type" varchar(120) NOT NULL,
	"size_bytes" integer NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"width" integer,
	"height" integer,
	"uploaded_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_assets_storage_key_unique" UNIQUE("storage_key")
);

CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"author_type" "message_author" NOT NULL,
	"author_user_id" uuid,
	"body" text DEFAULT '' NOT NULL,
	"is_internal" boolean DEFAULT false NOT NULL,
	"status" "message_status" DEFAULT 'delivered' NOT NULL,
	"external_message_id" varchar(255),
	"media_id" uuid,
	"meta" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(160) NOT NULL,
	"published_version_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "properties_slug_unique" UNIQUE("slug")
);

CREATE TABLE "property_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"status" "publish_status" DEFAULT 'draft' NOT NULL,
	"title" varchar(255) NOT NULL,
	"address" varchar(500) NOT NULL,
	"deal_type" "deal_type" NOT NULL,
	"area_sqm" numeric(12, 2) NOT NULL,
	"price_rub" numeric(16, 2) NOT NULL,
	"price_unit" "price_unit" NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"cover_id" uuid,
	"gallery_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"floor_plan_id" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by_id" uuid,
	"published_by_id" uuid,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "provider_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel" "channel" NOT NULL,
	"external_event_id" varchar(255) NOT NULL,
	"payload" jsonb NOT NULL,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "service_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" uuid NOT NULL,
	"status" "publish_status" DEFAULT 'draft' NOT NULL,
	"title" varchar(255) NOT NULL,
	"short_description" text DEFAULT '' NOT NULL,
	"full_description" text DEFAULT '' NOT NULL,
	"image_id" uuid,
	"work_items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by_id" uuid,
	"published_by_id" uuid,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(160) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"published_version_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "services_slug_unique" UNIQUE("slug")
);

CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash")
);

CREATE TABLE "site_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"contacts_html" text DEFAULT '' NOT NULL,
	"privacy_url" text DEFAULT '',
	"consent_url" text DEFAULT '',
	"channel_status" jsonb DEFAULT '{"telegram":{"enabled":false,"mode":"credentials_missing"},"max":{"enabled":false,"mode":"credentials_missing"},"whatsapp":{"enabled":false,"mode":"credentials_missing"},"test":{"enabled":true,"mode":"test_adapter"}}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "subscription_topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(120) NOT NULL,
	"title" varchar(255) NOT NULL,
	"consent_text" text NOT NULL,
	"consent_version" varchar(32) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_topics_slug_unique" UNIQUE("slug")
);

CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" uuid NOT NULL,
	"topic_id" uuid NOT NULL,
	"channel" "channel" NOT NULL,
	"consented_at" timestamp with time zone NOT NULL,
	"consent_text" text NOT NULL,
	"consent_version" varchar(32) NOT NULL,
	"source" varchar(120) NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel" "channel" NOT NULL,
	"external_thread_id" varchar(255),
	"contact_id" uuid,
	"lead_id" uuid,
	"mode" "thread_mode" DEFAULT 'bot' NOT NULL,
	"operator_id" uuid,
	"unread_count" integer DEFAULT 0 NOT NULL,
	"last_message_at" timestamp with time zone,
	"last_preview" text DEFAULT '',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"is_owner" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"permissions" jsonb DEFAULT '{"editContent":false,"publish":false,"leads":false,"contacts":false,"campaigns":false}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

ALTER TABLE "campaign_recipients" ADD CONSTRAINT "campaign_recipients_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "campaign_recipients" ADD CONSTRAINT "campaign_recipients_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_topic_id_subscription_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."subscription_topics"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_attachment_id_media_assets_id_fk" FOREIGN KEY ("attachment_id") REFERENCES "public"."media_assets"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "channel_identities" ADD CONSTRAINT "channel_identities_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_id_users_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "lead_markers" ADD CONSTRAINT "lead_markers_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "leads" ADD CONSTRAINT "leads_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "leads" ADD CONSTRAINT "leads_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "leads" ADD CONSTRAINT "leads_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "leads" ADD CONSTRAINT "leads_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "messages" ADD CONSTRAINT "messages_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "messages" ADD CONSTRAINT "messages_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "messages" ADD CONSTRAINT "messages_media_id_media_assets_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media_assets"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "property_versions" ADD CONSTRAINT "property_versions_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "property_versions" ADD CONSTRAINT "property_versions_cover_id_media_assets_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media_assets"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "property_versions" ADD CONSTRAINT "property_versions_floor_plan_id_media_assets_id_fk" FOREIGN KEY ("floor_plan_id") REFERENCES "public"."media_assets"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "property_versions" ADD CONSTRAINT "property_versions_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "property_versions" ADD CONSTRAINT "property_versions_published_by_id_users_id_fk" FOREIGN KEY ("published_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "service_versions" ADD CONSTRAINT "service_versions_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "service_versions" ADD CONSTRAINT "service_versions_image_id_media_assets_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media_assets"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "service_versions" ADD CONSTRAINT "service_versions_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "service_versions" ADD CONSTRAINT "service_versions_published_by_id_users_id_fk" FOREIGN KEY ("published_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_topic_id_subscription_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."subscription_topics"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "threads" ADD CONSTRAINT "threads_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "threads" ADD CONSTRAINT "threads_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "threads" ADD CONSTRAINT "threads_operator_id_users_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
CREATE UNIQUE INDEX "campaign_recipient_unique" ON "campaign_recipients" USING btree ("campaign_id","contact_id");
CREATE UNIQUE INDEX "channel_identity_unique" ON "channel_identities" USING btree ("channel","external_id");
CREATE INDEX "channel_identities_contact_idx" ON "channel_identities" USING btree ("contact_id");
CREATE UNIQUE INDEX "jobs_idempotency_unique" ON "jobs" USING btree ("idempotency_key") WHERE "jobs"."idempotency_key" is not null;
CREATE INDEX "jobs_status_run_idx" ON "jobs" USING btree ("status","run_after");
CREATE INDEX "lead_markers_lead_idx" ON "lead_markers" USING btree ("lead_id");
CREATE INDEX "leads_stage_idx" ON "leads" USING btree ("stage");
CREATE INDEX "leads_channel_idx" ON "leads" USING btree ("channel");
CREATE INDEX "messages_thread_idx" ON "messages" USING btree ("thread_id");
CREATE UNIQUE INDEX "messages_external_unique" ON "messages" USING btree ("thread_id","external_message_id") WHERE "messages"."external_message_id" is not null;
CREATE UNIQUE INDEX "property_version_unique" ON "property_versions" USING btree ("property_id","version");
CREATE INDEX "property_versions_status_idx" ON "property_versions" USING btree ("status");
CREATE UNIQUE INDEX "provider_events_unique" ON "provider_events" USING btree ("channel","external_event_id");
CREATE UNIQUE INDEX "service_version_unique" ON "service_versions" USING btree ("service_id","version");
CREATE INDEX "service_versions_status_idx" ON "service_versions" USING btree ("status");
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");
CREATE UNIQUE INDEX "subscriptions_unique" ON "subscriptions" USING btree ("contact_id","topic_id","channel");
CREATE INDEX "threads_lead_idx" ON "threads" USING btree ("lead_id");
CREATE INDEX "threads_channel_idx" ON "threads" USING btree ("channel");