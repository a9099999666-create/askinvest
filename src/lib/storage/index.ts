import { createHash, randomUUID } from "crypto";
import { mkdir, writeFile, readFile, unlink } from "fs/promises";
import path from "path";
import { getEnv } from "@/lib/env";

const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

const MAX_BYTES = 12 * 1024 * 1024;

export function assertAllowedMime(mime: string) {
  if (!ALLOWED.has(mime)) {
    throw new Error(`Формат не поддерживается: ${mime}`);
  }
}

function localRoot() {
  return path.resolve(getEnv().storageLocalPath);
}

export async function storeBuffer(opts: {
  buffer: Buffer;
  mimeType: string;
  originalName: string;
}) {
  assertAllowedMime(opts.mimeType);
  if (opts.buffer.length > MAX_BYTES) {
    throw new Error("Файл больше 12 МБ");
  }

  const ext =
    opts.mimeType === "application/pdf"
      ? "pdf"
      : opts.mimeType.split("/")[1] || "bin";
  const key = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${ext}`;

  if (getEnv().storageDriver === "s3" && getEnv().s3.bucket) {
    // S3-compatible upload kept optional; local fallback always works for acceptance.
    // Implement via fetch PUT when credentials present.
    const { endpoint, bucket, accessKey, secretKey, region } = getEnv().s3;
    if (!endpoint || !accessKey || !secretKey) {
      throw new Error("S3 настроен неполностью");
    }
    const url = `${endpoint.replace(/\/$/, "")}/${bucket}/${key}`;
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": opts.mimeType,
        "x-amz-content-sha256": createHash("sha256")
          .update(opts.buffer)
          .digest("hex"),
        "x-amz-meta-original-name": encodeURIComponent(opts.originalName),
        Authorization: `Bearer ${accessKey}:${secretKey}`,
        "x-amz-region": region,
      },
      body: new Uint8Array(opts.buffer),
    });
    if (!res.ok) {
      throw new Error(`S3 upload failed: ${res.status}`);
    }
    return { storageKey: `s3://${bucket}/${key}`, mimeType: opts.mimeType };
  }

  const full = path.join(localRoot(), key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, opts.buffer);
  return { storageKey: key, mimeType: opts.mimeType };
}

export async function readStored(storageKey: string) {
  if (storageKey.startsWith("s3://")) {
    throw new Error("Чтение S3 через API медиа: настройте проксирование");
  }
  const full = path.join(localRoot(), storageKey);
  return readFile(full);
}

export async function deleteStored(storageKey: string) {
  if (storageKey.startsWith("s3://")) return;
  try {
    await unlink(path.join(localRoot(), storageKey));
  } catch {
    /* ignore */
  }
}

export function sniffMime(buffer: Buffer, fallback: string) {
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return "image/jpeg";
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46
  ) {
    return "image/gif";
  }
  if (
    buffer.toString("ascii", 0, 4) === "%PDF"
  ) {
    return "application/pdf";
  }
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46
  ) {
    return "image/webp";
  }
  return fallback;
}
