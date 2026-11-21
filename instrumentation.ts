export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (
    !process.env.DATABASE_URL?.trim() &&
    !process.env.POSTGRES_URL?.trim() &&
    !process.env.POSTGRES_PRISMA_URL?.trim()
  ) {
    return;
  }
  const { ensureSchema } = await import("./src/db/ensure-schema");
  await ensureSchema();
}
