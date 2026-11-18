import { maxAdapter } from "./max";
import { telegramAdapter } from "./telegram";
import { testAdapter } from "./test";
import { whatsappAdapter } from "./whatsapp";
import type { ChannelAdapter, ChannelKind } from "./types";

export * from "./types";

const adapters: Record<ChannelKind, ChannelAdapter> = {
  telegram: telegramAdapter,
  max: maxAdapter,
  whatsapp: whatsappAdapter,
  test: testAdapter,
};

export function getAdapter(channel: ChannelKind): ChannelAdapter {
  return adapters[channel];
}

export function listChannelStatus() {
  return (Object.keys(adapters) as ChannelKind[]).map((kind) => {
    const adapter = adapters[kind];
    const configured = adapter.isConfigured();
    return {
      kind,
      configured,
      mode:
        kind === "test"
          ? "test_adapter"
          : configured
            ? "live"
            : "credentials_missing",
    };
  });
}

export function resolveOutboundChannel(preferred: ChannelKind): ChannelKind {
  const adapter = getAdapter(preferred);
  if (adapter.isConfigured() || preferred === "test") return preferred;
  if (getAdapter("test").isConfigured()) return "test";
  return preferred;
}
