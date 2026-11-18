import { NextResponse } from "next/server";
import { getAdapter, type ChannelKind } from "@/lib/channels";
import { processInboundEvent } from "@/lib/channels/inbound";
import { isTestChannelEnabled } from "@/lib/env";

const allowed: ChannelKind[] = ["telegram", "max", "whatsapp", "test"];

export async function GET(
  req: Request,
  ctx: { params: Promise<{ channel: string }> },
) {
  const { channel } = await ctx.params;
  if (channel === "whatsapp") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    const expected = process.env.WHATSAPP_VERIFY_TOKEN?.trim();
    if (!expected) {
      return NextResponse.json({ error: "Verify token not configured" }, { status: 403 });
    }
    if (mode === "subscribe" && token && token === expected) {
      return new NextResponse(challenge || "", { status: 200 });
    }
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ ok: true, channel });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ channel: string }> },
) {
  const { channel: raw } = await ctx.params;
  if (!allowed.includes(raw as ChannelKind)) {
    return NextResponse.json({ error: "Unknown channel" }, { status: 404 });
  }
  const channel = raw as ChannelKind;
  if (channel === "test" && !isTestChannelEnabled()) {
    return NextResponse.json({ error: "Test channel disabled" }, { status: 404 });
  }

  const adapter = getAdapter(channel);
  const rawBody = await req.text();
  const ok = await adapter.verifyWebhook(req, rawBody);
  if (!ok) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = JSON.parse(rawBody || "{}");
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const events = adapter.parseInbound(payload);
  const results = [];
  for (const event of events) {
    results.push(await processInboundEvent(channel, event));
  }
  return NextResponse.json({ ok: true, results });
}
