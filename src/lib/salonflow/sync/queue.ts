// Durable retry queue for sync work. DB-backed so the demo runs with no broker;
// in production this is the same shape over BullMQ/SQS (enqueue → claim → ack/nack
// with exponential backoff → dead-letter). Workers are stateless and idempotent,
// so the queue partitions cleanly by salon for horizontal scale.

import { prisma } from "@/lib/prisma";
import { backoffSeconds } from "./engine";

export type JobType = "pull" | "push" | "watch_renew" | "reconcile";

export async function enqueue(salonId: string, connectionId: string, type: JobType, payload: Record<string, unknown> = {}, opts: { maxAttempts?: number; runAfter?: Date } = {}) {
  return prisma.syncJob.create({
    data: { salonId, connectionId, type, payload: JSON.stringify(payload), maxAttempts: opts.maxAttempts ?? 5, runAfter: opts.runAfter ?? new Date() },
  });
}

/** Atomically claim due jobs (status=queued, runAfter<=now) and mark them running. */
export async function claimDueJobs(limit = 25) {
  const due = await prisma.syncJob.findMany({ where: { status: "queued", runAfter: { lte: new Date() } }, orderBy: { runAfter: "asc" }, take: limit });
  const claimed: typeof due = [];
  for (const job of due) {
    // optimistic claim: only succeeds if still queued (guards against double-pickup)
    const r = await prisma.syncJob.updateMany({ where: { id: job.id, status: "queued" }, data: { status: "running", attempts: { increment: 1 }, updatedAt: new Date() } });
    if (r.count === 1) claimed.push(job);
  }
  return claimed;
}

export async function completeJob(id: string) {
  await prisma.syncJob.update({ where: { id }, data: { status: "done", lastError: "" } });
}

/** Nack: reschedule with backoff, or dead-letter once attempts are exhausted. */
export async function failJob(id: string, attempts: number, maxAttempts: number, error: string) {
  if (attempts >= maxAttempts) {
    await prisma.syncJob.update({ where: { id }, data: { status: "dead", lastError: error.slice(0, 500) } });
    return "dead" as const;
  }
  const delay = backoffSeconds(attempts);
  await prisma.syncJob.update({ where: { id }, data: { status: "queued", runAfter: new Date(Date.now() + delay * 1000), lastError: error.slice(0, 500) } });
  return "retry" as const;
}

export async function queueDepth(salonId: string) {
  const [queued, running, dead] = await Promise.all([
    prisma.syncJob.count({ where: { salonId, status: "queued" } }),
    prisma.syncJob.count({ where: { salonId, status: "running" } }),
    prisma.syncJob.count({ where: { salonId, status: "dead" } }),
  ]);
  return { queued, running, dead };
}
