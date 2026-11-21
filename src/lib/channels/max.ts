import { timingSafeEqual } from "crypto";
import { getEnv } from "@/lib/env";
import type { ChannelAdapter, NormalizedInbound } from "./types";

export const maxAdapter: ChannelAdapter = {
  kind: "max",
  isConfigured() {
    try {
      return Boolean(getEnv().max.botToken && getEnv().max.webhookSecret);
    } catch {
      return false;
    }
  },
  verifyWebhook(req) {
    const secret = getEnv().max.webhookSecret;
    if (!secret) return false;
    const header = req.headers.get("x-max-signature") || "";
    try {
      const a = Buffer.from(header);
      const b = Buffer.from(secret);
      return a.length === b.length && timingSafeEqual(a, b);
    } catch {
      return false;
    }
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
    try {
      const link = getEnv().max.botLink;
      if (!link) return "";
      const sep = link.includes("?") ? "&" : "?";
      return `${link}${sep}start=${encodeURIComponent(markerCode)}`;
    } catch {
      return "";
    }
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
