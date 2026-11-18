import {
  boolean,
  customType,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  index,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
  toDriver(value) {
    return value;
  },
  fromDriver(value) {
    if (Buffer.isBuffer(value)) return value;
    return Buffer.from(value as Uint8Array);
  },
});

export const dealTypeEnum = pgEnum("deal_type", ["sale", "rent"]);
export const priceUnitEnum = pgEnum("price_unit", ["total", "per_month"]);
export const publishStatusEnum = pgEnum("publish_status", [
  "draft",
  "review",
  "published",
  "archived",
]);
export const channelEnum = pgEnum("channel", [
  "telegram",
  "max",
  "whatsapp",
  "test",
]);
export const leadStageEnum = pgEnum("lead_stage", [
  "new",
  "in_progress",
  "done",
]);
export const chatLinkStatusEnum = pgEnum("chat_link_status", [
  "not_started",
  "linked",
  "unlinked_inbound",
]);
export const threadModeEnum = pgEnum("thread_mode", ["bot", "human"]);
export const messageAuthorEnum = pgEnum("message_author", [
  "client",
  "bot",
  "staff",
  "system",
]);
export const messageStatusEnum = pgEnum("message_status", [
  "queued",
  "sent",
  "accepted",
  "delivered",
  "failed",
  "cancelled",
]);
export const campaignStatusEnum = pgEnum("campaign_status", [
  "draft",
  "ready",
  "running",
  "paused",
  "done",
  "cancelled",
]);
export const jobStatusEnum = pgEnum("job_status", [
  "pending",
  "processing",
  "done",
  "failed",
  "cancelled",
]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
};

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  passwordHash: text("password_hash").notNull(),
  isOwner: boolean("is_owner").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  permissions: jsonb("permissions")
    .$type<{
      editContent: boolean;
      publish: boolean;
      leads: boolean;
      contacts: boolean;
      campaigns: boolean;
    }>()
    .notNull()
    .default({
      editContent: false,
      publish: false,
      leads: false,
      contacts: false,
      campaigns: false,
    }),
  ...timestamps,
});

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const invitations = pgTable("invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  permissions: jsonb("permissions")
    .$type<{
      editContent: boolean;
      publish: boolean;
      leads: boolean;
      contacts: boolean;
      campaigns: boolean;
    }>()
    .notNull(),
  invitedById: uuid("invited_by_id")
    .notNull()
    .references(() => users.id),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  ...timestamps,
});

export const mediaAssets = pgTable("media_assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  storageKey: text("storage_key").notNull().unique(),
  mimeType: varchar("mime_type", { length: 120 }).notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  width: integer("width"),
  height: integer("height"),
  content: bytea("content"),
  uploadedById: uuid("uploaded_by_id").references(() => users.id),
  ...timestamps,
});

export const services = pgTable("services", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
  publishedVersionId: uuid("published_version_id"),
  ...timestamps,
});

export const serviceVersions = pgTable(
  "service_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
    status: publishStatusEnum("status").notNull().default("draft"),
    title: varchar("title", { length: 255 }).notNull(),
    shortDescription: text("short_description").notNull().default(""),
    fullDescription: text("full_description").notNull().default(""),
    imageId: uuid("image_id").references(() => mediaAssets.id),
    workItems: jsonb("work_items")
      .$type<{ id: string; text: string }[]>()
      .notNull()
      .default([]),
    version: integer("version").notNull().default(1),
    createdById: uuid("created_by_id").references(() => users.id),
    publishedById: uuid("published_by_id").references(() => users.id),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("service_version_unique").on(t.serviceId, t.version),
    index("service_versions_status_idx").on(t.status),
  ],
);

export const properties = pgTable("properties", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  publishedVersionId: uuid("published_version_id"),
  ...timestamps,
});

export const propertyVersions = pgTable(
  "property_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    status: publishStatusEnum("status").notNull().default("draft"),
    title: varchar("title", { length: 255 }).notNull(),
    address: varchar("address", { length: 500 }).notNull(),
    dealType: dealTypeEnum("deal_type").notNull(),
    areaSqm: numeric("area_sqm", { precision: 12, scale: 2 }).notNull(),
    priceRub: numeric("price_rub", { precision: 16, scale: 2 }).notNull(),
    priceUnit: priceUnitEnum("price_unit").notNull(),
    description: text("description").notNull().default(""),
    coverId: uuid("cover_id").references(() => mediaAssets.id),
    galleryIds: jsonb("gallery_ids").$type<string[]>().notNull().default([]),
    floorPlanId: uuid("floor_plan_id").references(() => mediaAssets.id),
    version: integer("version").notNull().default(1),
    createdById: uuid("created_by_id").references(() => users.id),
    publishedById: uuid("published_by_id").references(() => users.id),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("property_version_unique").on(t.propertyId, t.version),
    index("property_versions_status_idx").on(t.status),
  ],
);

export const contacts = pgTable("contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  displayName: varchar("display_name", { length: 255 }),
  phone: varchar("phone", { length: 64 }),
  email: varchar("email", { length: 255 }),
  notes: text("notes").default(""),
  ...timestamps,
});

export const channelIdentities = pgTable(
  "channel_identities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    channel: channelEnum("channel").notNull(),
    externalId: varchar("external_id", { length: 255 }).notNull(),
    meta: jsonb("meta").$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("channel_identity_unique").on(t.channel, t.externalId),
    index("channel_identities_contact_idx").on(t.contactId),
  ],
);

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    publicKey: varchar("public_key", { length: 64 }).notNull().unique(),
    stage: leadStageEnum("stage").notNull().default("new"),
    channel: channelEnum("channel").notNull(),
    question: text("question").notNull(),
    visitorName: varchar("visitor_name", { length: 255 }),
    visitorPhone: varchar("visitor_phone", { length: 64 }),
    sourcePage: varchar("source_page", { length: 500 }),
    intent: varchar("intent", { length: 64 }).default("discuss"),
    serviceId: uuid("service_id").references(() => services.id),
    propertyId: uuid("property_id").references(() => properties.id),
    serviceTitleSnapshot: varchar("service_title_snapshot", { length: 255 }),
    propertyTitleSnapshot: varchar("property_title_snapshot", { length: 255 }),
    contactId: uuid("contact_id").references(() => contacts.id),
    assigneeId: uuid("assignee_id").references(() => users.id),
    note: text("note").default(""),
    nextAction: text("next_action").default(""),
    nextActionAt: timestamp("next_action_at", { withTimezone: true }),
    chatLinkStatus: chatLinkStatusEnum("chat_link_status")
      .notNull()
      .default("not_started"),
    ...timestamps,
  },
  (t) => [
    index("leads_stage_idx").on(t.stage),
    index("leads_channel_idx").on(t.channel),
  ],
);

export const leadMarkers = pgTable(
  "lead_markers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    channel: channelEnum("channel").notNull(),
    code: varchar("code", { length: 32 }).notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index("lead_markers_lead_idx").on(t.leadId)],
);

export const threads = pgTable(
  "threads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    channel: channelEnum("channel").notNull(),
    externalThreadId: varchar("external_thread_id", { length: 255 }),
    contactId: uuid("contact_id").references(() => contacts.id),
    leadId: uuid("lead_id").references(() => leads.id),
    mode: threadModeEnum("mode").notNull().default("bot"),
    operatorId: uuid("operator_id").references(() => users.id),
    unreadCount: integer("unread_count").notNull().default(0),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
    lastPreview: text("last_preview").default(""),
    ...timestamps,
  },
  (t) => [
    index("threads_lead_idx").on(t.leadId),
    index("threads_channel_idx").on(t.channel),
  ],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    threadId: uuid("thread_id")
      .notNull()
      .references(() => threads.id, { onDelete: "cascade" }),
    authorType: messageAuthorEnum("author_type").notNull(),
    authorUserId: uuid("author_user_id").references(() => users.id),
    body: text("body").notNull().default(""),
    isInternal: boolean("is_internal").notNull().default(false),
    status: messageStatusEnum("status").notNull().default("delivered"),
    externalMessageId: varchar("external_message_id", { length: 255 }),
    mediaId: uuid("media_id").references(() => mediaAssets.id),
    meta: jsonb("meta").$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [
    index("messages_thread_idx").on(t.threadId),
    uniqueIndex("messages_external_unique")
      .on(t.threadId, t.externalMessageId)
      .where(sql`${t.externalMessageId} is not null`),
  ],
);

export const providerEvents = pgTable(
  "provider_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    channel: channelEnum("channel").notNull(),
    externalEventId: varchar("external_event_id", { length: 255 }).notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("provider_events_unique").on(t.channel, t.externalEventId),
  ],
);

export const subscriptionTopics = pgTable("subscription_topics", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  consentText: text("consent_text").notNull(),
  consentVersion: varchar("consent_version", { length: 32 }).notNull(),
  ...timestamps,
});

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    topicId: uuid("topic_id")
      .notNull()
      .references(() => subscriptionTopics.id),
    channel: channelEnum("channel").notNull(),
    consentedAt: timestamp("consented_at", { withTimezone: true }).notNull(),
    consentText: text("consent_text").notNull(),
    consentVersion: varchar("consent_version", { length: 32 }).notNull(),
    source: varchar("source", { length: 120 }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("subscriptions_unique").on(t.contactId, t.topicId, t.channel),
  ],
);

export const campaigns = pgTable("campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  topicId: uuid("topic_id").references(() => subscriptionTopics.id),
  channel: channelEnum("channel"),
  status: campaignStatusEnum("status").notNull().default("draft"),
  attachmentId: uuid("attachment_id").references(() => mediaAssets.id),
  createdById: uuid("created_by_id").references(() => users.id),
  startedAt: timestamp("started_at", { withTimezone: true }),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  ...timestamps,
});

export const campaignRecipients = pgTable(
  "campaign_recipients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contacts.id),
    channel: channelEnum("channel").notNull(),
    status: messageStatusEnum("status").notNull().default("queued"),
    error: text("error"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("campaign_recipient_unique").on(t.campaignId, t.contactId),
  ],
);

export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: varchar("type", { length: 120 }).notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    status: jobStatusEnum("status").notNull().default("pending"),
    runAfter: timestamp("run_after", { withTimezone: true })
      .notNull()
      .defaultNow(),
    attempts: integer("attempts").notNull().default(0),
    lastError: text("last_error"),
    idempotencyKey: varchar("idempotency_key", { length: 255 }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("jobs_idempotency_unique")
      .on(t.idempotencyKey)
      .where(sql`${t.idempotencyKey} is not null`),
    index("jobs_status_run_idx").on(t.status, t.runAfter),
  ],
);

export const siteSettings = pgTable("site_settings", {
  id: integer("id").primaryKey().default(1),
  contactsHtml: text("contacts_html").notNull().default(""),
  privacyUrl: text("privacy_url").default(""),
  consentUrl: text("consent_url").default(""),
  channelStatus: jsonb("channel_status")
    .$type<Record<string, { enabled: boolean; mode: string; note?: string }>>()
    .notNull()
    .default({
      telegram: { enabled: false, mode: "credentials_missing" },
      max: { enabled: false, mode: "credentials_missing" },
      whatsapp: { enabled: false, mode: "credentials_missing" },
      test: { enabled: true, mode: "test_adapter" },
    }),
  ...timestamps,
});
