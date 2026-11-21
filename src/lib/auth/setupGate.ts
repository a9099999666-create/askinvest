import { getIdentity } from "../../../cursor/identity";
import { secretEqual } from "@/lib/auth/secretEqual";

export async function authorizeOwnerSetup(req: Request, setupToken?: string) {
  const identity = await getIdentity(req);
  if (identity.verified) return true;
  const headerToken = req.headers.get("x-setup-token") || "";
  return secretEqual(process.env.SETUP_TOKEN, setupToken || headerToken);
}

export function setupTokenConfigured() {
  return Boolean(process.env.SETUP_TOKEN?.trim());
}
