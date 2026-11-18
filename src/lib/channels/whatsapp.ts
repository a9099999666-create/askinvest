import { createHmac, timingSafeEqual } from "crypto";
import { getEnv } from "@/lib/env";
import type { ChannelAdapter, NormalizedInbound } from "./types";

export const whatsappAdapter: ChannelAdapter = {
  kind: "whatsapp",
  isConfigured() {
    const e = getEnv().whatsapp;
    return Boolean(e.accessToken && e.phoneNumberId && e.businessNumber);
  },
  verifyWebhook(req, rawBody) {
    const secret = getEnv().whatsapp.appSecret;
    if (!secret) return Boolean(getEnv().whatsapp.accessToken);
    const sig = req.headers.get("x-hub-signature-256") || "";
    const expected =
      "sha256=" +
      createHmac("sha256", secret).update(rawBody).digest("hex");
    try {
      return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
    } catch {
      return false;
    }
  },
  parseInbound(payload) {
    const body = payload as {
      entry?: Array<{
        id?: string;
        changes?: Array<{
          value?: {
            messages?: Array<{
              id?: string;
              from?: string;
              text?: { body?: string };
              timestamp?: string;
            }>;
            contacts?: Array<{ profile?: { name?: string }; wa_id?: string }>;
          };
        }>;
      }>;
    };
    const results: NormalizedInbound[] = [];
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value;
        for (const msg of value?.messages || []) {
          if (!msg.id || !msg.from) continue;
          const text = msg.text?.body || "";
          const markerMatch = text.match(/ASK-([A-Z0-9]{6,12})/i);
          results.push({
            externalEventId: msg.id,
            externalThreadId: msg.from,
            externalUserId: msg.from,
            externalMessageId: msg.id,
            text,
            displayName: value?.contacts?.[0]?.profile?.name,
            markerCode: markerMatch?.[1]?.toUpperCase(),
            raw: payload,
          });
        }
      }
    }
    return results;
  },
  buildDeepLink(markerCode) {
    const number = getEnv().whatsapp.businessNumber;
    const text = encodeURIComponent(
      `Здравствуйте! Хочу обсудить задачу. Код заявки ASK-${markerCode}`,
    );
    if (!number) {
      return `/api/channels/test/start?code=${encodeURIComponent(markerCode)}&via=whatsapp`;
    }
    const digits = number.replace(/\D/g, "");
    return `https://wa.me/${digits}?text=${text}`;
  },
  async sendText({ externalThreadId, text }) {
    const e = getEnv().whatsapp;
    if (!e.accessToken || !e.phoneNumberId) {
      return {
        externalMessageId: "",
        status: "failed",
        error: "WhatsApp credentials отсутствуют",
      };
    }
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${e.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${e.accessToken}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: externalThreadId,
          type: "text",
          text: { body: text },
        }),
      },
    );
    const data = (await res.json().catch(() => ({}))) as {
      messages?: Array<{ id?: string }>;
      error?: { message?: string };
    };
    if (!res.ok) {
      return {
        externalMessageId: "",
        status: "failed",
        error: data.error?.message || `HTTP ${res.status}`,
      };
    }
    return {
      externalMessageId: String(data.messages?.[0]?.id || Date.now()),
      status: "accepted",
    };
  },
};
