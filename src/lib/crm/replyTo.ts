export function parseReplyTo(value?: string) {
  const raw = value?.trim() || "";
  if (!raw) return { phone: undefined, email: undefined };
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
    return { phone: undefined, email: raw.toLowerCase() };
  }
  return { phone: raw, email: undefined };
}
