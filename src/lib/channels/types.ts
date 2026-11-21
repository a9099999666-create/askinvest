export type ChannelKind = "telegram" | "max" | "whatsapp" | "test";

export type NormalizedInbound = {
  externalEventId: string;
  externalThreadId: string;
  externalUserId: string;
  externalMessageId: string;
  text: string;
  displayName?: string;
  markerCode?: string;
  raw: Record<string, unknown>;
};

export type OutboundResult = {
  externalMessageId: string;
  status: "sent" | "accepted" | "failed";
  error?: string;
};

export type ChannelAdapter = {
  kind: ChannelKind;
  isConfigured: () => boolean;
  verifyWebhook: (req: Request, rawBody: string) => boolean | Promise<boolean>;
  parseInbound: (payload: Record<string, unknown>) => NormalizedInbound[];
  buildDeepLink: (markerCode: string) => string;
  sendText: (opts: {
    externalThreadId: string;
    externalUserId: string;
    text: string;
  }) => Promise<OutboundResult>;
};
