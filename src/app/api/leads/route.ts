import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { properties, propertyVersions, services, serviceVersions } from "@/db/schema";
import { createLeadFromForm } from "@/lib/crm/leads";
import { nanoid } from "@/lib/utils";

const schema = z.object({
  question: z.string().min(1),
  channel: z.enum(["telegram", "max", "whatsapp", "test"]),
  publicKey: z
    .string()
    .optional()
    .transform((value) => (value && value.length >= 8 ? value : undefined)),
  visitorName: z.string().optional(),
  visitorPhone: z.string().optional(),
  sourcePage: z.string().optional(),
  intent: z.string().optional(),
  serviceId: z.string().uuid().optional(),
  propertyId: z.string().uuid().optional(),
});

function first(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : undefined;
}

function leadReturnUrl(req: Request, sourcePage: string | undefined, flag: "error" | "channel") {
  const path = sourcePage?.startsWith("/") ? sourcePage.split("?")[0] : "/";
  const url = new URL(path || "/", req.url);
  url.searchParams.set("lead", flag);
  return url;
}

async function readBody(req: Request) {
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return schema.parse(await req.json());
  }
  const form = await req.formData();
  return schema.parse({
    question: first(form.get("question")),
    channel: first(form.get("channel")) || "telegram",
    publicKey: first(form.get("publicKey")),
    visitorName: first(form.get("visitorName")),
    visitorPhone: first(form.get("visitorPhone")),
    sourcePage: first(form.get("sourcePage")),
    intent: first(form.get("intent")),
    serviceId: first(form.get("serviceId")) || undefined,
    propertyId: first(form.get("propertyId")) || undefined,
  });
}

export async function POST(req: Request) {
  const wantsHtml = (req.headers.get("accept") || "").includes("text/html");
  let sourcePage = "/";
  try {
    const body = await readBody(req);
    sourcePage = body.sourcePage || "/";

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
      publicKey: body.publicKey || nanoid(),
      serviceTitleSnapshot,
      propertyTitleSnapshot,
    });

    if (wantsHtml) {
      if (result.deepLink) {
        return NextResponse.redirect(result.deepLink, 303);
      }
      return NextResponse.redirect(leadReturnUrl(req, body.sourcePage, "channel"), 303);
    }

    return NextResponse.json({
      leadId: result.lead.id,
      markerCode: result.markerCode,
      deepLink: result.deepLink,
      reused: result.reused,
      chatLinkStatus: result.lead.chatLinkStatus,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка";
    if (wantsHtml) {
      return NextResponse.redirect(leadReturnUrl(req, sourcePage, "error"), 303);
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
