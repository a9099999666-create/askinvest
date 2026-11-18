import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { processInboundEvent } from "@/lib/channels/inbound";
import { getEnv, isTestChannelEnabled } from "@/lib/env";
import { nanoid } from "@/lib/utils";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function authorizeTestStart(req: Request) {
  if (!isTestChannelEnabled()) return false;
  const secret = getEnv().testChannelSecret;
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }
  const url = new URL(req.url);
  const fromQuery = url.searchParams.get("secret") || "";
  const fromHeader = req.headers.get("x-test-channel-secret") || "";
  const provided = fromHeader || fromQuery;
  try {
    const a = Buffer.from(provided);
    const b = Buffer.from(secret);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Локальный deep-link тестового адаптера: имитирует старт чата с маркером. */
export async function GET(req: Request) {
  if (!authorizeTestStart(req)) {
    return NextResponse.json({ error: "Test channel unavailable" }, { status: 404 });
  }

  const url = new URL(req.url);
  const code = (url.searchParams.get("code") || "").toUpperCase();
  const via = url.searchParams.get("via") || "test";
  if (!code || !/^[A-Z0-9]{6,16}$/.test(code)) {
    return NextResponse.json({ error: "code required" }, { status: 400 });
  }

  const userId = `test-user-${code.slice(0, 4)}`;
  const threadId = `test-thread-${code}`;
  const eventId = nanoid();
  const messageId = nanoid();

  const result = await processInboundEvent("test", {
    externalEventId: eventId,
    externalThreadId: threadId,
    externalUserId: userId,
    externalMessageId: messageId,
    text: `/start ${code}`,
    displayName: `Тест ${via.replace(/[^\w\s.-]/g, "").slice(0, 40)}`,
    markerCode: code,
    raw: { via: via.slice(0, 40), code },
  });

  await processInboundEvent("test", {
    externalEventId: nanoid(),
    externalThreadId: threadId,
    externalUserId: userId,
    externalMessageId: nanoid(),
    text: "Здравствуйте, хочу уточнить детали",
    displayName: `Тест`,
    raw: { via: "test" },
  });

  const safeCode = escapeHtml(code);
  const safeVia = escapeHtml(via.slice(0, 40));
  const linked = result.linked ? "привязана" : "не привязана / дубликат";

  const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8"/><title>Тестовый канал</title>
  <style>body{font-family:sans-serif;max-width:560px;margin:40px auto;padding:0 16px;color:#0f2744}
  .ok{background:#e8f7ef;padding:16px;border-radius:12px}</style></head>
  <body><h1>Тестовый адаптер АСКИНВЕСТ</h1>
  <div class="ok">Чат начат с кодом <strong>${safeCode}</strong> (via ${safeVia}).
  Связь: ${linked}.
  Откройте кабинет → Диалоги. Worker отправит автоответ бота.</div>
  <p><a href="/admin/inbox">Перейти в диалоги</a></p></body></html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
