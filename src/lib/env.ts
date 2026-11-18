function requireDatabaseUrl() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL is required");
  }
  return url;
}

export function isProduction() {
  return process.env.NODE_ENV === "production";
}

export function isTestChannelEnabled() {
  if (process.env.ENABLE_TEST_CHANNEL !== "true") return false;
  if (isProduction() && !process.env.TEST_CHANNEL_SECRET?.trim()) {
    return false;
  }
  return true;
}

export function getEnv() {
  return {
    databaseUrl: requireDatabaseUrl(),
    appUrl: process.env.APP_URL || "http://localhost:3000",
    sessionSecret: (() => {
      const secret = process.env.SESSION_SECRET?.trim();
      if (secret) return secret;
      if (isProduction()) {
        throw new Error("SESSION_SECRET is required in production");
      }
      return "local-dev-session-secret";
    })(),
    storageDriver: process.env.STORAGE_DRIVER || "local",
    storageLocalPath: process.env.STORAGE_LOCAL_PATH || "./storage/uploads",
    s3: {
      endpoint: process.env.S3_ENDPOINT || "",
      region: process.env.S3_REGION || "us-east-1",
      bucket: process.env.S3_BUCKET || "",
      accessKey: process.env.S3_ACCESS_KEY || "",
      secretKey: process.env.S3_SECRET_KEY || "",
    },
    telegram: {
      botToken: process.env.TELEGRAM_BOT_TOKEN || "",
      webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || "",
      botUsername: process.env.TELEGRAM_BOT_USERNAME || "",
    },
    max: {
      botToken: process.env.MAX_BOT_TOKEN || "",
      webhookSecret: process.env.MAX_WEBHOOK_SECRET || "",
      botLink: process.env.MAX_BOT_LINK || "",
    },
    whatsapp: {
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN || "",
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
      businessNumber: process.env.WHATSAPP_BUSINESS_NUMBER || "",
      verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || "",
      appSecret: process.env.WHATSAPP_APP_SECRET || "",
    },
    testChannelSecret: process.env.TEST_CHANNEL_SECRET || "",
    allowDemoSeed: process.env.ALLOW_DEMO_SEED === "true",
  };
}
