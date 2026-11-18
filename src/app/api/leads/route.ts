import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { properties, propertyVersions, services, serviceVersions } from "@/db/schema";
import { createLeadFromForm } from "@/lib/crm/leads";
import { nanoid } from "@/lib/utils";

const schema = z.object({
  question: z.string().trim().min(1),
  channel: z.enum(["telegram", "max", "whatsapp", "test"]),
  publicKey: z
    .string()
    .optional()
    .transform((value) => (value && value.length >= 8 ? value : undefined)),
  visitorName: z.string().optional(),
  visitorPhone: z.string().optional(),
  visitorEmail: z.string().optional(),
  sourcePage: z.string().optional(),
  intent: z.string().optional(),
  serviceId: z.string().uuid().optional(),
  propertyId: z.string().uuid().optional(),
});

function first(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : undefined;
}

function safeSourcePath(sourcePage: string | undefined) {
  if (sourcePage && /^\/[a-zA-Z0-9/_-]*$/.test(sourcePage)) {
    return sourcePage;
  }
  return "/";
}

function leadReturnUrl(
  req: Request,
  sourcePage: string | undefined,
  flag: "error" | "ok",
) {
  const url = new URL(safeSourcePath(sourcePage), req.url);
  url.search = "";
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
    visitorEmail: first(form.get("visitorEmail")),
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
    sourcePage = safeSourcePath(body.sourcePage);

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
      sourcePage,
      publicKey: body.publicKey || nanoid(),
      serviceTitleSnapshot,
      propertyTitleSnapshot,
    });

    if (wantsHtml) {
      if (!result.reused && result.deepLink?.startsWith("https://")) {
        return NextResponse.redirect(result.deepLink, 303);
      }
      return NextResponse.redirect(leadReturnUrl(req, sourcePage, "ok"), 303);
    }

    if (result.reused) {
      return NextResponse.json({
        ok: true,
        reused: true,
        leadId: result.lead.id,
      });
    }

    return NextResponse.json({
      leadId: result.lead.id,
      markerCode: result.markerCode,
      deepLink: result.deepLink,
      reused: false,
      chatLinkStatus: result.lead.chatLinkStatus,
    });
  } catch {
    if (wantsHtml) {
      return NextResponse.redirect(leadReturnUrl(req, sourcePage, "error"), 303);
    }
    return NextResponse.json({ error: "Не удалось сохранить заявку" }, { status: 400 });
  }
}
