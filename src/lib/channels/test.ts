import type { ChannelAdapter, NormalizedInbound } from "./types";

export const testAdapter: ChannelAdapter = {
  kind: "test",
  isConfigured: () => true,
  verifyWebhook: () => true,
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
    return `/api/channels/test/start?code=${encodeURIComponent(markerCode)}`;
  },
  async sendText({ text }) {
    return {
      externalMessageId: `test-out-${Date.now()}`,
      status: "accepted",
      error: text ? undefined : "empty",
    };
  },
};
