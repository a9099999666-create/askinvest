import { NextResponse } from "next/server";
import { processInboundEvent } from "@/lib/channels/inbound";
import { nanoid } from "@/lib/utils";

/** Локальный deep-link тестового адаптера: имитирует старт чата с маркером. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = (url.searchParams.get("code") || "").toUpperCase();
  const via = url.searchParams.get("via") || "test";
  if (!code) {
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
    displayName: `Тест ${via}`,
    markerCode: code,
    raw: { via, code },
  });

  // second message as client question
  await processInboundEvent("test", {
    externalEventId: nanoid(),
    externalThreadId: threadId,
    externalUserId: userId,
    externalMessageId: nanoid(),
    text: "Здравствуйте, хочу уточнить детали",
    displayName: `Тест ${via}`,
    raw: { via },
  });

  const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8"/><title>Тестовый канал</title>
  <style>body{font-family:sans-serif;max-width:560px;margin:40px auto;padding:0 16px;color:#0f2744}
  .ok{background:#e8f7ef;padding:16px;border-radius:12px}</style></head>
  <body><h1>Тестовый адаптер АСКИНВЕСТ</h1>
  <div class="ok">Чат начат с кодом <strong>${code}</strong> (via ${via}).
  Связь: ${result.linked ? "привязана" : "не привязана / дубликат"}.
  Откройте кабинет → Диалоги. Worker отправит автоответ бота.</div>
  <p><a href="/admin/inbox">Перейти в диалоги</a></p></body></html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
