import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { mediaAssets } from "@/db/schema";
import { requireUser } from "@/lib/auth/session";
import { sniffMime, storeBuffer } from "@/lib/storage";

export async function POST(req: Request) {
  try {
    const user = await requireUser("editContent");
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Файл обязателен" }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const mime = sniffMime(buffer, file.type || "application/octet-stream");
    const stored = await storeBuffer({
      buffer,
      mimeType: mime,
      originalName: file.name,
    });
    const [asset] = await db
      .insert(mediaAssets)
      .values({
        storageKey: stored.storageKey,
        mimeType: stored.mimeType,
        sizeBytes: buffer.length,
        originalName: file.name,
        uploadedById: user.id,
      })
      .returning();
    return NextResponse.json(asset);
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ошибка" },
      { status: 400 },
    );
  }
}
