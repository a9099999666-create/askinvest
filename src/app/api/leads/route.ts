import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { properties, propertyVersions, services, serviceVersions } from "@/db/schema";
import { createLeadFromForm } from "@/lib/crm/leads";

const schema = z.object({
  question: z.string().min(1),
  channel: z.enum(["telegram", "max", "whatsapp", "test"]),
  publicKey: z.string().min(8),
  visitorName: z.string().optional(),
  visitorPhone: z.string().optional(),
  sourcePage: z.string().optional(),
  intent: z.string().optional(),
  serviceId: z.string().uuid().optional(),
  propertyId: z.string().uuid().optional(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const body = schema.parse(json);

    let serviceTitleSnapshot: string | undefined;
    let propertyTitleSnapshot: string | undefined;

    if (body.serviceId) {
      const service = await db.query.services.findFirst({
        where: eq(services.id, body.serviceId),
      });
      if (service?.publishedVersionId) {
        const v = await db.query.serviceVersions.findFirst({
          where: eq(serviceVersions.id, service.publishedVersionId),
        });
        serviceTitleSnapshot = v?.title;
      }
    }
    if (body.propertyId) {
      const property = await db.query.properties.findFirst({
        where: eq(properties.id, body.propertyId),
      });
      if (property?.publishedVersionId) {
        const v = await db.query.propertyVersions.findFirst({
          where: eq(propertyVersions.id, property.publishedVersionId),
        });
        propertyTitleSnapshot = v?.title;
      }
    }

    const result = await createLeadFromForm({
      ...body,
      serviceTitleSnapshot,
      propertyTitleSnapshot,
    });

    return NextResponse.json({
      leadId: result.lead.id,
      markerCode: result.markerCode,
      deepLink: result.deepLink,
      reused: result.reused,
      chatLinkStatus: result.lead.chatLinkStatus,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ошибка" },
      { status: 400 },
    );
  }
}
