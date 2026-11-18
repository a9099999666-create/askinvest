import { timingSafeEqual } from "crypto";
import { getEnv } from "@/lib/env";
import type { ChannelAdapter, NormalizedInbound } from "./types";

export const telegramAdapter: ChannelAdapter = {
  kind: "telegram",
  isConfigured() {
    return Boolean(getEnv().telegram.botToken);
  },
  verifyWebhook(req) {
    const secret = getEnv().telegram.webhookSecret;
    if (!secret) return Boolean(getEnv().telegram.botToken);
    const header = req.headers.get("x-telegram-bot-api-secret-token") || "";
    try {
      return timingSafeEqual(Buffer.from(header), Buffer.from(secret));
    } catch {
      return false;
    }
  },
  parseInbound(payload) {
    const update = payload as {
      update_id?: number;
      message?: {
        message_id?: number;
        text?: string;
        chat?: { id?: number };
        from?: { id?: number; first_name?: string; last_name?: string };
      };
    };
    const msg = update.message;
    if (!msg?.message_id || !msg.chat?.id || !msg.from?.id) return [];
    const text = msg.text || "";
    let markerCode: string | undefined;
    const start = text.match(/^\/start(?:\s+(.+))?$/i);
    if (start?.[1]) markerCode = start[1].trim();
    const inbound: NormalizedInbound = {
      externalEventId: String(update.update_id ?? msg.message_id),
      externalThreadId: String(msg.chat.id),
      externalUserId: String(msg.from.id),
      externalMessageId: String(msg.message_id),
      text,
      displayName: [msg.from.first_name, msg.from.last_name]
        .filter(Boolean)
        .join(" "),
      markerCode,
      raw: payload,
    };
    return [inbound];
  },
  buildDeepLink(markerCode) {
    const username = getEnv().telegram.botUsername;
    if (!username) {
      return `/api/channels/test/start?code=${encodeURIComponent(markerCode)}&via=telegram`;
    }
    return `https://t.me/${username}?start=${encodeURIComponent(markerCode)}`;
  },
  async sendText({ externalThreadId, text }) {
    const token = getEnv().telegram.botToken;
    if (!token) {
      return {
        externalMessageId: "",
        status: "failed",
        error: "TELEGRAM_BOT_TOKEN отсутствует",
      };
    }
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: externalThreadId, text }),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      result?: { message_id?: number };
      description?: string;
    };
    if (!data.ok) {
      return {
        externalMessageId: "",
        status: "failed",
        error: data.description || `HTTP ${res.status}`,
      };
    }
    return {
      externalMessageId: String(data.result?.message_id || Date.now()),
      status: "accepted",
    };
  },
};
