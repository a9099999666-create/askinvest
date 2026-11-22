export const TABLE_SENTINELS = [
  ["users", "password_hash"],
  ["media_assets", "storage_key"],
  ["site_settings", "contacts_html"],
  ["contacts", "notes"],
  ["leads", "public_key"],
  ["properties", "slug"],
  ["services", "slug"],
  ["property_versions", "address"],
  ["service_versions", "short_description"],
  ["sessions", "token_hash"],
  ["messages", "body"],
  ["threads", "unread_count"],
  ["campaigns", "title"],
  ["campaign_recipients", "campaign_id"],
  ["channel_identities", "external_id"],
  ["invitations", "token_hash"],
  ["jobs", "payload"],
  ["lead_markers", "code"],
  ["provider_events", "external_event_id"],
  ["subscription_topics", "consent_text"],
  ["subscriptions", "consent_version"],
] as const;

export const DUPLICATE_SCHEMA_CODES = new Set([
  "42710", // duplicate_object
  "42P07", // duplicate_table
  "42701", // duplicate_column
  "42P16", // invalid_table_definition (often duplicate constraint)
  "42723", // duplicate_function
]);

export function isDuplicateSchemaError(error: unknown) {
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code?: unknown }).code)
      : "";
  return DUPLICATE_SCHEMA_CODES.has(code);
}

export function splitSqlStatements(sql: string) {
  const out: string[] = [];
  let buf = "";
  let i = 0;
  let inSingle = false;
  let inDouble = false;
  let dollar: string | null = null;

  while (i < sql.length) {
    const c = sql[i];
    if (dollar) {
      if (sql.startsWith(dollar, i)) {
        buf += dollar;
        i += dollar.length;
        dollar = null;
        continue;
      }
      buf += c;
      i += 1;
      continue;
    }
    if (inSingle) {
      buf += c;
      if (c === "'" && sql[i + 1] === "'") {
        buf += "'";
        i += 2;
        continue;
      }
      if (c === "'") inSingle = false;
      i += 1;
      continue;
    }
    if (inDouble) {
      buf += c;
      if (c === '"') inDouble = false;
      i += 1;
      continue;
    }
    if (c === "-" && sql[i + 1] === "-") {
      while (i < sql.length && sql[i] !== "\n") {
        buf += sql[i];
        i += 1;
      }
      continue;
    }
    if (c === "'") {
      inSingle = true;
      buf += c;
      i += 1;
      continue;
    }
    if (c === '"') {
      inDouble = true;
      buf += c;
      i += 1;
      continue;
    }
    if (c === "$") {
      const match = sql.slice(i).match(/^\$[A-Za-z0-9_]*\$/);
      if (match) {
        dollar = match[0];
        buf += dollar;
        i += dollar.length;
        continue;
      }
    }
    if (c === ";") {
      const stmt = buf.trim();
      if (stmt) out.push(stmt);
      buf = "";
      i += 1;
      continue;
    }
    buf += c;
    i += 1;
  }
  const tail = buf.trim();
  if (tail) out.push(tail);
  return out;
}
