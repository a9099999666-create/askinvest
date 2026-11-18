import { getEnv } from "@/lib/env";
import type { ChannelAdapter, NormalizedInbound } from "./types";

/** Адаптер MAX: каркас под вебхуки бота; без credentials — deep-link через тест. */
export const maxAdapter: ChannelAdapter = {
  kind: "max",
  isConfigured() {
    return Boolean(getEnv().max.botToken);
  },
  verifyWebhook(req) {
    const secret = getEnv().max.webhookSecret;
    if (!secret) return Boolean(getEnv().max.botToken);
    return req.headers.get("x-max-signature") === secret;
  },
  parseInbound(payload) {
    const body = payload as {
      event_id?: string;
      message?: {
        id?: string;
        text?: string;
        chat_id?: string;
        user?: { id?: string; name?: string };
        start_payload?: string;
      };
    };
    const msg = body.message;
    if (!msg?.id || !msg.chat_id || !msg.user?.id) return [];
    const inbound: NormalizedInbound = {
      externalEventId: String(body.event_id || msg.id),
      externalThreadId: String(msg.chat_id),
      externalUserId: String(msg.user.id),
      externalMessageId: String(msg.id),
      text: msg.text || "",
      displayName: msg.user.name,
      markerCode: msg.start_payload || undefined,
      raw: payload,
    };
    return [inbound];
  },
  buildDeepLink(markerCode) {
    const link = getEnv().max.botLink;
    if (!link) {
      return `/api/channels/test/start?code=${encodeURIComponent(markerCode)}&via=max`;
    }
    const sep = link.includes("?") ? "&" : "?";
    return `${link}${sep}start=${encodeURIComponent(markerCode)}`;
  },
  async sendText({ externalThreadId, externalUserId, text }) {
    const token = getEnv().max.botToken;
    if (!token) {
      return {
        externalMessageId: "",
        status: "failed",
        error: "MAX_BOT_TOKEN отсутствует",
      };
    }
    // Endpoint уточняется по актуальной документации MAX перед боевым подключением.
    const res = await fetch("https://botapi.max.ru/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        chat_id: externalThreadId,
        user_id: externalUserId,
        text,
      }),
    });
    if (!res.ok) {
      return {
        externalMessageId: "",
        status: "failed",
        error: `MAX HTTP ${res.status}`,
      };
    }
    const data = (await res.json().catch(() => ({}))) as { id?: string };
    return {
      externalMessageId: String(data.id || Date.now()),
      status: "accepted",
    };
  },
};
