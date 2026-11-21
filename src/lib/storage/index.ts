import { createHash, createHmac, randomUUID } from "crypto";
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

function sha256Hex(value: string | Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

function hmac(key: Buffer | string, value: string) {
  return createHmac("sha256", key).update(value).digest();
}

async function putS3Object(opts: {
  endpoint: string;
  bucket: string;
  key: string;
  region: string;
  accessKey: string;
  secretKey: string;
  body: Buffer;
  contentType: string;
  originalName: string;
}) {
  const url = new URL(`${opts.endpoint.replace(/\/$/, "")}/${opts.bucket}/${opts.key}`);
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256Hex(opts.body);
  const originalName = encodeURIComponent(opts.originalName);
  const headers: Record<string, string> = {
    "content-type": opts.contentType,
    host: url.host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
    "x-amz-meta-original-name": originalName,
  };
  const signedHeaderNames = Object.keys(headers).sort();
  const canonicalHeaders = signedHeaderNames
    .map((name) => `${name}:${headers[name]}\n`)
    .join("");
  const signedHeaders = signedHeaderNames.join(";");
  const canonicalRequest = [
    "PUT",
    url.pathname,
    url.searchParams.toString(),
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");
  const credentialScope = `${dateStamp}/${opts.region}/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");
  const signingKey = hmac(
    hmac(hmac(hmac(`AWS4${opts.secretKey}`, dateStamp), opts.region), "s3"),
    "aws4_request",
  );
  const signature = createHmac("sha256", signingKey).update(stringToSign).digest("hex");
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": opts.contentType,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
      "x-amz-meta-original-name": originalName,
      Authorization: `AWS4-HMAC-SHA256 Credential=${opts.accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    },
    body: new Uint8Array(opts.body),
  });
  if (!res.ok) {
    throw new Error(`S3 upload failed: ${res.status}`);
  }
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
    const { endpoint, bucket, accessKey, secretKey, region } = getEnv().s3;
    if (!endpoint || !accessKey || !secretKey) {
      throw new Error("S3 настроен неполностью");
    }
    await putS3Object({
      endpoint,
      bucket,
      key,
      region,
      accessKey,
      secretKey,
      body: opts.buffer,
      contentType: opts.mimeType,
      originalName: opts.originalName,
    });
    return { storageKey: `s3://${bucket}/${key}`, mimeType: opts.mimeType };
  }

  try {
    const full = path.join(localRoot(), key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, opts.buffer);
  } catch {
    // Host filesystems are ephemeral; Postgres keeps the bytes.
  }
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
