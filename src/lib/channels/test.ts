import { timingSafeEqual } from "crypto";
import { getEnv, isTestChannelEnabled } from "@/lib/env";
import type { ChannelAdapter, NormalizedInbound } from "./types";

export const testAdapter: ChannelAdapter = {
  kind: "test",
  isConfigured() {
    return isTestChannelEnabled();
  },
  verifyWebhook(req) {
    if (!isTestChannelEnabled()) return false;
    const secret = getEnv().testChannelSecret;
    if (!secret) {
      // local only: ENABLE_TEST_CHANNEL without secret
      return process.env.NODE_ENV !== "production";
    }
    const header = req.headers.get("x-test-channel-secret") || "";
    try {
      const a = Buffer.from(header);
      const b = Buffer.from(secret);
      return a.length === b.length && timingSafeEqual(a, b);
    } catch {
      return false;
    }
  },
  parseInbound(payload) {
    const event = payload as {
      eventId?: string;
      threadId?: string;
      userId?: string;
      messageId?: string;
      text?: string;
      displayName?: string;
      markerCode?: string;
    };
    if (!event.eventId || !event.threadId || !event.userId || !event.messageId) {
      return [];
    }
    const inbound: NormalizedInbound = {
      externalEventId: event.eventId,
      externalThreadId: event.threadId,
      externalUserId: event.userId,
      externalMessageId: event.messageId,
      text: event.text || "",
      displayName: event.displayName,
      markerCode: event.markerCode,
      raw: payload,
    };
    return [inbound];
  },
  buildDeepLink(markerCode) {
    if (!isTestChannelEnabled()) return "";
    if (process.env.NODE_ENV === "production") return "";
    return `/api/channels/test/start?code=${encodeURIComponent(markerCode)}`;
  },
  async sendText({ text }) {
    if (!isTestChannelEnabled()) {
      return {
        externalMessageId: "",
        status: "failed",
        error: "Тестовый канал выключен",
      };
    }
    return {
      externalMessageId: `test-out-${Date.now()}`,
      status: "accepted",
      error: text ? undefined : "empty",
    };
  },
};
