import { timingSafeEqual } from "crypto";

export function secretEqual(expected?: string | null, provided?: string | null) {
  const left = expected?.trim() || "";
  const right = provided?.trim() || "";
  if (!left || !right) return false;
  try {
    const a = Buffer.from(left);
    const b = Buffer.from(right);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
