function databaseUrl() {
  return (
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    process.env.POSTGRES_PRISMA_URL?.trim() ||
    ""
  );
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
    databaseUrl: databaseUrl(),
    appUrl:
      process.env.APP_URL ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : "http://localhost:3000"),
    sessionSecret:
      process.env.SESSION_SECRET?.trim() ||
      (isProduction() ? "" : "local-dev-session-secret"),
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
