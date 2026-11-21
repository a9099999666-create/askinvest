import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { siteSettings } from "@/db/schema";
import { requireUser } from "@/lib/auth/session";
import { revalidatePublic } from "@/lib/public/revalidate";

export async function PATCH(req: Request) {
  try {
    const user = await requireUser();
    if (!user.isOwner) {
      return NextResponse.json({ error: "Только владелец" }, { status: 403 });
    }
    const body = await req.json();
    const [row] = await db
      .update(siteSettings)
      .set({
        contactPhone: String(body.contactPhone || "").slice(0, 64),
        contactAddress: String(body.contactAddress || "").slice(0, 500),
        contactHours: String(body.contactHours || "").slice(0, 255),
        contactsHtml: String(body.contactsHtml || ""),
        updatedAt: new Date(),
      })
      .where(eq(siteSettings.id, 1))
      .returning();
    revalidatePublic();
    return NextResponse.json({ settings: row });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ошибка" },
      { status: 400 },
    );
  }
}
