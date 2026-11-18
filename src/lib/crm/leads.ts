import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { leadMarkers, leads } from "@/db/schema";
import { getAdapter, resolveOutboundChannel, type ChannelKind } from "@/lib/channels";
import { nanoid, shortCode } from "@/lib/utils";

export async function createLeadFromForm(input: {
  question: string;
  channel: ChannelKind;
  publicKey: string;
  sourcePage?: string;
  intent?: string;
  visitorName?: string;
  visitorPhone?: string;
  serviceId?: string;
  propertyId?: string;
  serviceTitleSnapshot?: string;
  propertyTitleSnapshot?: string;
}) {
  const existing = await db.query.leads.findFirst({
    where: eq(leads.publicKey, input.publicKey),
  });
  if (existing) {
    const marker = await db.query.leadMarkers.findFirst({
      where: eq(leadMarkers.leadId, existing.id),
    });
    const channel = resolveOutboundChannel(existing.channel as ChannelKind);
    const adapter = getAdapter(channel);
    return {
      lead: existing,
      markerCode: marker?.code || "",
      deepLink: marker ? adapter.buildDeepLink(marker.code) : "",
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
      visitorName: input.visitorName || null,
      visitorPhone: input.visitorPhone || null,
      sourcePage: input.sourcePage || null,
      intent: input.intent || "discuss",
      serviceId: input.serviceId || null,
      propertyId: input.propertyId || null,
      serviceTitleSnapshot: input.serviceTitleSnapshot || null,
      propertyTitleSnapshot: input.propertyTitleSnapshot || null,
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

  const adapter = getAdapter(channel);
  return {
    lead,
    markerCode: code,
    deepLink: adapter.buildDeepLink(code),
    reused: false,
  };
}
