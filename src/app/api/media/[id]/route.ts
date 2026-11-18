import { and, eq, or, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { mediaAssets, propertyVersions, serviceVersions } from "@/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { readStored } from "@/lib/storage";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const asset = await db.query.mediaAssets.findFirst({
    where: eq(mediaAssets.id, id),
  });
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const user = await getSessionUser();
  if (!user) {
    const [svc] = await db
      .select({ id: serviceVersions.id })
      .from(serviceVersions)
      .where(
        and(
          eq(serviceVersions.imageId, id),
          eq(serviceVersions.status, "published"),
        ),
      )
      .limit(1);
    const [prop] = await db
      .select({ id: propertyVersions.id })
      .from(propertyVersions)
      .where(
        and(
          eq(propertyVersions.status, "published"),
          or(
            eq(propertyVersions.coverId, id),
            eq(propertyVersions.floorPlanId, id),
            sql`${propertyVersions.galleryIds}::jsonb ? ${id}`,
          ),
        ),
      )
      .limit(1);
    if (!svc && !prop) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  try {
    const buf = await readStored(asset.storageKey);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": asset.mimeType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Missing file" }, { status: 404 });
  }
}
