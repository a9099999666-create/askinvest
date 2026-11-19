import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { contacts, leadMarkers, leads } from "@/db/schema";
import { getAdapter, resolveOutboundChannel, type ChannelKind } from "@/lib/channels";
import { parseReplyTo } from "@/lib/crm/replyTo";
import { nanoid, shortCode } from "@/lib/utils";

async function upsertContact(input: {
  name?: string;
  phone?: string;
  email?: string;
  note?: string;
}) {
  const name = input.name?.trim() || "";
  const phone = input.phone?.trim() || "";
  const email = input.email?.trim().toLowerCase() || "";
  if (!name && !phone && !email) return null;

  const existing = phone
    ? await db.query.contacts.findFirst({ where: eq(contacts.phone, phone) })
    : email
      ? await db.query.contacts.findFirst({ where: eq(contacts.email, email) })
      : null;

  if (existing) {
    await db
      .update(contacts)
      .set({
        displayName: name || existing.displayName,
        phone: phone || existing.phone,
        email: email || existing.email,
        notes: existing.notes || input.note || "",
        updatedAt: new Date(),
      })
      .where(eq(contacts.id, existing.id));
    return existing.id;
  }

  const [row] = await db
    .insert(contacts)
    .values({
      displayName: name || null,
      phone: phone || null,
      email: email || null,
      notes: input.note || "",
    })
    .returning({ id: contacts.id });
  return row.id;
}

function deepLinkFor(channel: ChannelKind, code: string) {
  try {
    const adapter = getAdapter(channel);
    if (!adapter.isConfigured()) return "";
    return adapter.buildDeepLink(code) || "";
  } catch {
    return "";
  }
}

export async function createLeadFromForm(input: {
  question: string;
  channel: ChannelKind;
  publicKey: string;
  sourcePage?: string;
  intent?: string;
  visitorName?: string;
  visitorPhone?: string;
  visitorEmail?: string;
  replyTo?: string;
  serviceId?: string;
  propertyId?: string;
  serviceTitleSnapshot?: string;
  propertyTitleSnapshot?: string;
}) {
  const fromReply = parseReplyTo(input.replyTo);
  const visitorPhone = input.visitorPhone?.trim() || fromReply.phone;
  const visitorEmail = input.visitorEmail?.trim().toLowerCase() || fromReply.email;

  const contactId = await upsertContact({
    name: input.visitorName,
    phone: visitorPhone,
    email: visitorEmail,
    note: input.question,
  });

  const existing = await db.query.leads.findFirst({
    where: eq(leads.publicKey, input.publicKey),
  });
  if (existing) {
    const [updated] = await db
      .update(leads)
      .set({
        question: input.question || existing.question,
        visitorName: input.visitorName?.trim() || existing.visitorName,
        visitorPhone: visitorPhone || existing.visitorPhone,
        visitorEmail: visitorEmail || existing.visitorEmail,
        contactId: contactId || existing.contactId,
        updatedAt: new Date(),
      })
      .where(eq(leads.id, existing.id))
      .returning();
    return {
      lead: updated ?? existing,
      markerCode: "",
      deepLink: "",
      reused: true,
    };
  }

  const channel = resolveOutboundChannel(input.channel);
  const [lead] = await db
    .insert(leads)
    .values({
      publicKey: input.publicKey || nanoid(),
      channel,
      question: input.question,
      visitorName: input.visitorName?.trim() || null,
      visitorPhone: visitorPhone || null,
      visitorEmail: visitorEmail || null,
      sourcePage: input.sourcePage || null,
      intent: input.intent || "discuss",
      serviceId: input.serviceId || null,
      propertyId: input.propertyId || null,
      serviceTitleSnapshot: input.serviceTitleSnapshot || null,
      propertyTitleSnapshot: input.propertyTitleSnapshot || null,
      contactId,
      chatLinkStatus: "not_started",
      stage: "new",
    })
    .returning();

  const code = shortCode().toUpperCase();
  await db.insert(leadMarkers).values({
    leadId: lead.id,
    channel,
    code,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });

  return {
    lead,
    markerCode: code,
    deepLink: deepLinkFor(channel, code),
    reused: false,
  };
}
