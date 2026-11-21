import { and, eq, lte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { jobs } from "@/db/schema";

export async function enqueueJob(opts: {
  type: string;
  payload: Record<string, unknown>;
  idempotencyKey?: string;
  runAfter?: Date;
}) {
  try {
    const [row] = await db
      .insert(jobs)
      .values({
        type: opts.type,
        payload: opts.payload,
        idempotencyKey: opts.idempotencyKey,
        runAfter: opts.runAfter || new Date(),
      })
      .onConflictDoNothing()
      .returning();
    if (row && (!opts.runAfter || opts.runAfter.getTime() <= Date.now())) {
      const { drainJobs } = await import("@/lib/queue");
      await drainJobs(3);
    }
    return row || null;
  } catch {
    return null;
  }
}

export async function claimNextJob() {
  const pending = await db.query.jobs.findMany({
    where: and(eq(jobs.status, "pending"), lte(jobs.runAfter, new Date())),
    limit: 5,
    orderBy: (t, { asc }) => [asc(t.runAfter)],
  });

  for (const job of pending) {
    const [claimed] = await db
      .update(jobs)
      .set({
        status: "processing",
        attempts: job.attempts + 1,
        updatedAt: new Date(),
      })
      .where(and(eq(jobs.id, job.id), eq(jobs.status, "pending")))
      .returning();
    if (claimed) return claimed;
  }
  return null;
}

export async function completeJob(id: string) {
  await db
    .update(jobs)
    .set({ status: "done", updatedAt: new Date() })
    .where(eq(jobs.id, id));
}

export async function failJob(id: string, error: string, retry = true) {
  const job = await db.query.jobs.findFirst({ where: eq(jobs.id, id) });
  if (!job) return;
  if (retry && job.attempts < 5) {
    await db
      .update(jobs)
      .set({
        status: "pending",
        lastError: error,
        runAfter: new Date(Date.now() + job.attempts * 2000),
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, id));
  } else {
    await db
      .update(jobs)
      .set({
        status: "failed",
        lastError: error,
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, id));
  }
}

export async function cancelPendingJobsForThread(threadId: string) {
  await db.execute(sql`
    update jobs
    set status = 'cancelled', updated_at = now()
    where status = 'pending'
      and type = 'bot.auto_reply'
      and payload->>'threadId' = ${threadId}
  `);
}
