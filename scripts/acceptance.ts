/**
 * Локальная приёмка ключевых сценариев через API.
 * Требует OWNER_EMAIL, OWNER_PASSWORD, DATABASE_URL, ENABLE_TEST_CHANNEL=true,
 * запущенные next (APP_URL) и желательно worker.
 */
import { and, eq, isNull } from "drizzle-orm";
import { db, sql } from "../src/db/client";
import {
  campaignRecipients,
  channelIdentities,
  contacts,
  leads,
  messages,
  subscriptions,
  subscriptionTopics,
  threads,
  users,
} from "../src/db/schema";
import { hashPassword } from "../src/lib/auth/session";
import { OWNER_PERMISSIONS } from "../src/lib/auth/permissions";

const APP = process.env.APP_URL || "http://localhost:3000";
const OWNER_EMAIL = process.env.OWNER_EMAIL?.trim();
const OWNER_PASSWORD = process.env.OWNER_PASSWORD;

async function req(
  path: string,
  init: RequestInit & { cookie?: string } = {},
) {
  const headers = new Headers(init.headers || {});
  if (init.cookie) headers.set("cookie", init.cookie);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`${APP}${path}`, { ...init, headers });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { res, json, headers: res.headers };
}

function getCookie(headers: Headers) {
  const raw = headers.getSetCookie?.() || [];
  if (raw.length) return raw.map((c) => c.split(";")[0]).join("; ");
  const single = headers.get("set-cookie");
  return single ? single.split(";")[0] : "";
}

async function main() {
  if (!OWNER_EMAIL || !OWNER_PASSWORD) {
    console.error("Задайте OWNER_EMAIL и OWNER_PASSWORD в окружении");
    process.exit(1);
  }
  if (process.env.ENABLE_TEST_CHANNEL !== "true") {
    console.error("Для приёмки нужен ENABLE_TEST_CHANNEL=true");
    process.exit(1);
  }

  const results: { name: string; ok: boolean; detail?: string }[] = [];

  let owner = await db.query.users.findFirst({
    where: eq(users.email, OWNER_EMAIL.toLowerCase()),
  });
  if (!owner) {
    await db.insert(users).values({
      email: OWNER_EMAIL.toLowerCase(),
      name: "Владелец",
      passwordHash: await hashPassword(OWNER_PASSWORD),
      isOwner: true,
      isActive: true,
      permissions: OWNER_PERMISSIONS,
    });
    owner = await db.query.users.findFirst({
      where: eq(users.email, OWNER_EMAIL.toLowerCase()),
    });
  }

  const login = await req("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: OWNER_EMAIL,
      password: OWNER_PASSWORD,
    }),
  });
  const cookie = getCookie(login.headers);
  results.push({
    name: "Вход владельца",
    ok: login.res.ok && Boolean(cookie),
    detail: String(login.res.status),
  });

  const serviceCreate = await req("/api/admin/services", {
    method: "POST",
    cookie,
    body: JSON.stringify({
      title: "Приёмка: сопровождение",
      shortDescription: "Кратко",
      fullDescription: "Полное",
      workItems: [
        { id: "1", text: "Шаг A" },
        { id: "2", text: "Шаг B" },
      ],
    }),
  });
  const serviceId = (serviceCreate.json as { service?: { id: string } })?.service
    ?.id;
  const pub = await req(`/api/admin/services/${serviceId}/publish`, {
    method: "POST",
    cookie,
  });
  results.push({
    name: "Создание и публикация услуги",
    ok: serviceCreate.res.ok && pub.res.ok,
    detail: serviceId,
  });

  const propCreate = await req("/api/admin/properties", {
    method: "POST",
    cookie,
    body: JSON.stringify({
      title: "Склад приёмки",
      address: "Тестовая ул., 1",
      dealType: "rent",
      areaSqm: "500",
      priceRub: "350000",
      priceUnit: "per_month",
      description: "Аренда для приёмки",
    }),
  });
  const propertyId = (propCreate.json as { property?: { id: string } })?.property
    ?.id;
  const propPub = await req(`/api/admin/properties/${propertyId}/publish`, {
    method: "POST",
    cookie,
  });
  results.push({
    name: "Публикация объекта аренды",
    ok: propCreate.res.ok && propPub.res.ok,
    detail: propertyId,
  });

  const key = `acc-${Date.now()}`;
  const leadBody = {
    question: "Нужна консультация по аренде",
    channel: "test",
    publicKey: key,
    sourcePage: "/",
    propertyId,
  };
  const l1 = await req("/api/leads", {
    method: "POST",
    body: JSON.stringify(leadBody),
  });
  const l2 = await req("/api/leads", {
    method: "POST",
    body: JSON.stringify(leadBody),
  });
  const leadId = (l1.json as { leadId?: string }).leadId;
  const marker = (l1.json as { markerCode?: string }).markerCode;
  const deepLink = (l1.json as { deepLink?: string }).deepLink;
  const same =
    leadId && leadId === (l2.json as { leadId?: string }).leadId;
  const lead = await db.query.leads.findFirst({ where: eq(leads.id, leadId!) });
  results.push({
    name: "Идемпотентная заявка, чат не начат",
    ok: Boolean(same && lead?.chatLinkStatus === "not_started" && marker && deepLink),
    detail: leadId,
  });

  if (deepLink) {
    const start = await fetch(`${APP}${deepLink}`);
    results.push({
      name: "Тестовый канал: старт чата",
      ok: start.ok,
      detail: String(start.status),
    });
  }

  await new Promise((r) => setTimeout(r, 2500));
  const thread = await db.query.threads.findFirst({
    where: eq(threads.leadId, leadId!),
  });
  const msgs = thread
    ? await db.select().from(messages).where(eq(messages.threadId, thread.id))
    : [];
  results.push({
    name: "Привязка ветки и сообщения",
    ok: Boolean(thread && msgs.some((m) => m.authorType === "client")),
    detail: thread?.id,
  });

  if (thread) {
    const take = await req(`/api/admin/threads/${thread.id}/take`, {
      method: "POST",
      cookie,
    });
    const after = await db.query.threads.findFirst({
      where: eq(threads.id, thread.id),
    });
    results.push({
      name: "Взять диалог",
      ok: take.res.ok && after?.mode === "human",
    });
  }

  const staffEmail = `staff${Date.now()}@askinvest.local`;
  const staffPassword = process.env.STAFF_PASSWORD || `Staff-${Date.now()}x`;
  const invite = await req("/api/admin/staff/invite", {
    method: "POST",
    cookie,
    body: JSON.stringify({
      email: staffEmail,
      name: "Сотрудник",
      password: staffPassword,
      permissions: {
        editContent: true,
        publish: false,
        leads: true,
        contacts: true,
        campaigns: false,
      },
    }),
  });
  const staffLogin = await req("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: staffEmail, password: staffPassword }),
  });
  const staffCookie = getCookie(staffLogin.headers);
  const denied = await req(`/api/admin/services/${serviceId}/publish`, {
    method: "POST",
    cookie: staffCookie,
  });
  results.push({
    name: "Публикация без права отклоняется",
    ok: invite.res.ok && denied.res.status === 403,
    detail: String(denied.res.status),
  });

  let topic = await db.query.subscriptionTopics.findFirst({
    where: eq(subscriptionTopics.slug, "rent"),
  });
  if (!topic) {
    const [t] = await db
      .insert(subscriptionTopics)
      .values({
        slug: "rent",
        title: "Аренда",
        consentText: "согласие",
        consentVersion: "1",
      })
      .returning();
    topic = t;
  }
  const [cOk] = await db
    .insert(contacts)
    .values({ displayName: "Подписчик" })
    .returning();
  const [cNo] = await db
    .insert(contacts)
    .values({ displayName: "Отписанный" })
    .returning();
  await db.insert(channelIdentities).values([
    { contactId: cOk.id, channel: "test", externalId: `ok-${Date.now()}` },
    { contactId: cNo.id, channel: "test", externalId: `no-${Date.now()}` },
  ]);
  await db.insert(subscriptions).values({
    contactId: cOk.id,
    topicId: topic.id,
    channel: "test",
    consentedAt: new Date(),
    consentText: "согласие",
    consentVersion: "1",
    source: "acceptance",
  });
  await db.insert(subscriptions).values({
    contactId: cNo.id,
    topicId: topic.id,
    channel: "test",
    consentedAt: new Date(),
    consentText: "согласие",
    consentVersion: "1",
    source: "acceptance",
    revokedAt: new Date(),
  });

  const ownerLogin2 = await req("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: OWNER_EMAIL,
      password: OWNER_PASSWORD,
    }),
  });
  const ownerCookie = getCookie(ownerLogin2.headers);
  const camp = await req("/api/admin/campaigns", {
    method: "POST",
    cookie: ownerCookie,
    body: JSON.stringify({
      title: "Тест аренды",
      body: "Сообщение кампании",
      topicId: topic.id,
      channel: "test",
    }),
  });
  const campaignId = (camp.json as { campaign?: { id: string } }).campaign?.id;
  const preview = await req(`/api/admin/campaigns/${campaignId}/preview`, {
    method: "POST",
    cookie: ownerCookie,
  });
  const recipients = await db
    .select()
    .from(campaignRecipients)
    .where(eq(campaignRecipients.campaignId, campaignId!));
  const onlyActive = recipients.every((r) => r.contactId === cOk.id);
  results.push({
    name: "Кампания: только активный подписчик",
    ok:
      preview.res.ok &&
      (preview.json as { count?: number }).count === 1 &&
      onlyActive,
    detail: `count=${(preview.json as { count?: number }).count}`,
  });

  const home = await fetch(APP);
  results.push({
    name: "Главная отдаёт HTML",
    ok: home.ok && (await home.text()).includes("АСКИНВЕСТ"),
  });

  // test channel disabled path: without secret in prod-like check of unauthorized webhook
  const blocked = await req("/api/channels/test/webhook", {
    method: "POST",
    body: JSON.stringify({}),
  });
  results.push({
    name: "Тестовый вебхук без подписи отклоняется",
    ok: blocked.res.status === 401 || blocked.res.status === 404,
    detail: String(blocked.res.status),
  });

  console.log("\n=== ASKINVEST acceptance ===");
  for (const r of results) {
    console.log(
      `${r.ok ? "OK" : "FAIL"} · ${r.name}${r.detail ? ` · ${r.detail}` : ""}`,
    );
  }
  const failed = results.filter((r) => !r.ok).length;
  console.log(failed ? `\nFailed: ${failed}` : "\nAll checks passed");
  await sql.end({ timeout: 5 });
  process.exit(failed ? 1 : 0);
}

main().catch(async (e) => {
  console.error(e);
  await sql.end({ timeout: 5 });
  process.exit(1);
});
