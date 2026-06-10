// Orchestration: connect/onboard, two-way sync, and job dispatch. Ties the
// provider adapters, pure engine, retry queue, and database together. Every
// operation is scoped by salonId (the tenant) and idempotent.

import { prisma } from "@/lib/prisma";
import type { ConnectionCtx, ProviderId } from "./types";
import { getProvider, isProviderLive } from "./providers";
import { mockProvider } from "./providers/mock";
import { planOutbound, reconcileInbound, type EventLink } from "./engine";
import { isoToSlot, slotToIso } from "./time";
import { claimDueJobs, completeJob, enqueue, failJob, queueDepth } from "./queue";

/* eslint-disable @typescript-eslint/no-explicit-any */
function ctxOf(c: any): ConnectionCtx {
  return { connectionId: c.id, accessToken: c.accessToken, refreshToken: c.refreshToken, externalAccount: c.externalAccount, syncToken: c.syncToken };
}
async function log(salonId: string, connectionId: string, level: "info" | "warn" | "error", event: string, message = "") {
  await prisma.syncLog.create({ data: { salonId, connectionId, level, event, message: message.slice(0, 500) } });
}
function webhookUrl(provider: ProviderId) {
  const base = process.env.PUBLIC_BASE_URL ?? "http://localhost:3000";
  return `${base}/api/salonflow/sync/webhook/${provider}`;
}

// ── onboarding ────────────────────────────────────────────────────────────────
/** Step 1: returns an OAuth redirect for live providers, or connects immediately in the demo. */
export async function beginConnect(salonId: string, staffId: string, provider: ProviderId): Promise<{ redirectUrl: string | null; connectionId?: string }> {
  if (isProviderLive(provider)) {
    const state = Buffer.from(JSON.stringify({ salonId, staffId, provider })).toString("base64url");
    return { redirectUrl: getProvider(provider).getAuthUrl(state, webhookUrl(provider).replace("/webhook/", "/oauth/callback/")) };
  }
  // demo: simulate a completed OAuth exchange
  const tokens = await mockProvider.exchangeCode();
  const conn = await finalizeConnection(salonId, staffId, provider, `${provider}@demo.salon`, tokens.accessToken, tokens.refreshToken, tokens.expiresAt);
  return { redirectUrl: null, connectionId: conn.id };
}

/** Step 2 (live): OAuth callback exchanges the code and finalizes the connection. */
export async function completeOAuth(salonId: string, staffId: string, provider: ProviderId, code: string, redirectUri: string) {
  const tokens = await getProvider(provider).exchangeCode(code, redirectUri);
  return finalizeConnection(salonId, staffId, provider, `${provider}-account`, tokens.accessToken, tokens.refreshToken, tokens.expiresAt);
}

async function finalizeConnection(salonId: string, staffId: string, provider: ProviderId, account: string, accessToken: string, refreshToken: string, expiresAt: string | null) {
  const conn = await prisma.calendarConnection.create({ data: { salonId, staffId, provider, externalAccount: account, accessToken, refreshToken, tokenExpiresAt: expiresAt ? new Date(expiresAt) : null, status: "active" } });
  await prisma.salon.update({ where: { id: salonId }, data: { calendarConnected: true } }).catch(() => {});
  await log(salonId, conn.id, "info", "connected", `${provider} connected for staff ${staffId}`);
  // register push subscription where supported, else rely on poll jobs
  const provider_ = getProvider(provider);
  if (provider_.supportsPush && provider_.watch) {
    try {
      const ch = await provider_.watch(ctxOf(conn), webhookUrl(provider));
      await prisma.calendarChannel.create({ data: { salonId, connectionId: conn.id, provider, channelId: ch.channelId, resourceId: ch.resourceId, clientState: ch.clientState, expiresAt: new Date(ch.expiresAt) } });
      await enqueue(salonId, conn.id, "watch_renew", {}, { runAfter: new Date(Date.parse(ch.expiresAt) - 3600e3) });
    } catch (e: any) { await log(salonId, conn.id, "warn", "watch_failed", String(e?.message ?? e)); }
  }
  await enqueue(salonId, conn.id, "pull"); // initial backfill
  return conn;
}

export async function disconnect(salonId: string, connectionId: string) {
  const conn = await prisma.calendarConnection.findFirst({ where: { id: connectionId, salonId } });
  if (!conn) return;
  const channels = await prisma.calendarChannel.findMany({ where: { connectionId } });
  const provider = getProvider(conn.provider as ProviderId);
  for (const ch of channels) { try { await provider.stopWatch?.(ctxOf(conn), ch.channelId, ch.resourceId); } catch { /* best effort */ } }
  await prisma.calendarChannel.deleteMany({ where: { connectionId } });
  await prisma.externalBusyBlock.deleteMany({ where: { connectionId } });
  await prisma.calendarConnection.update({ where: { id: connectionId }, data: { status: "disconnected" } });
  await log(salonId, connectionId, "info", "disconnected");
}

// ── inbound (pull + reconcile) ─────────────────────────────────────────────────
export async function pull(connectionId: string): Promise<{ busy: number; cancelled: number; echoes: number }> {
  const conn = await prisma.calendarConnection.findUnique({ where: { id: connectionId } });
  if (!conn || conn.status === "disconnected") return { busy: 0, cancelled: 0, echoes: 0 };
  const provider = getProvider(conn.provider as ProviderId);
  const { events, nextSyncToken } = await provider.listChanges(ctxOf(conn));
  const links: EventLink[] = (await prisma.externalEventLink.findMany({ where: { connectionId } })).map((l) => ({ externalId: l.externalId, etag: l.etag }));
  const plan = reconcileInbound(events, links);

  for (const ev of plan.busyUpserts) {
    const slot = isoToSlot(ev.startsAt, ev.endsAt);
    await prisma.externalBusyBlock.upsert({
      where: { connectionId_externalId: { connectionId, externalId: ev.externalId } },
      create: { salonId: conn.salonId, connectionId, staffId: conn.staffId, externalId: ev.externalId, etag: ev.etag, summary: ev.summary, startsAt: new Date(ev.startsAt), endsAt: new Date(ev.endsAt), day: slot.day, start: slot.start, end: slot.end },
      update: { etag: ev.etag, summary: ev.summary, startsAt: new Date(ev.startsAt), endsAt: new Date(ev.endsAt), day: slot.day, start: slot.start, end: slot.end, cancelled: false },
    });
  }
  for (const externalId of plan.cancellations) {
    await prisma.externalBusyBlock.updateMany({ where: { connectionId, externalId }, data: { cancelled: true } });
  }
  await prisma.calendarConnection.update({ where: { id: connectionId }, data: { syncToken: nextSyncToken, lastSyncedAt: new Date(), status: "active", lastError: "" } });
  await log(conn.salonId, connectionId, "info", "pull", `busy:${plan.busyUpserts.length} cancelled:${plan.cancellations.length} echoes:${plan.echoes.length} ownEdited:${plan.ourEdited.length}`);
  return { busy: plan.busyUpserts.length, cancelled: plan.cancellations.length, echoes: plan.echoes.length };
}

// ── outbound (push appointment → external mirror) ──────────────────────────────
export async function pushAppointment(salonId: string, appointmentId: string) {
  const appt = await prisma.appointment.findFirst({ where: { id: appointmentId, salonId } });
  if (!appt) return;
  const active = appt.status !== "cancelled";
  // mirror to every two-way connection for this staff member
  const conns = await prisma.calendarConnection.findMany({ where: { salonId, staffId: appt.staffId, status: "active", direction: { in: ["two_way", "outbound"] } } });
  for (const conn of conns) {
    const provider = getProvider(conn.provider as ProviderId);
    const link = await prisma.externalEventLink.findUnique({ where: { connectionId_appointmentId: { connectionId: conn.id, appointmentId } } });
    const action = planOutbound(active, link ? { externalId: link.externalId, etag: link.etag } : undefined);
    const svc = await prisma.service.findUnique({ where: { id: appt.serviceId } });
    const out = { summary: `SalonFlow: ${svc?.name ?? "Appointment"}`, startsAt: slotToIso(appt.day, appt.start), endsAt: slotToIso(appt.day, appt.end) };
    try {
      if (action.action === "create") {
        const r = await provider.createEvent(ctxOf(conn), out);
        await prisma.externalEventLink.create({ data: { salonId, connectionId: conn.id, appointmentId, externalId: r.externalId, etag: r.etag } });
      } else if (action.action === "update") {
        const r = await provider.updateEvent(ctxOf(conn), action.externalId, out, action.etag);
        await prisma.externalEventLink.update({ where: { connectionId_appointmentId: { connectionId: conn.id, appointmentId } }, data: { etag: r.etag } });
      } else if (action.action === "delete") {
        await provider.deleteEvent(ctxOf(conn), action.externalId);
        await prisma.externalEventLink.delete({ where: { connectionId_appointmentId: { connectionId: conn.id, appointmentId } } });
      }
      if (action.action !== "noop") await log(salonId, conn.id, "info", `push_${action.action}`, appointmentId);
    } catch (e: any) {
      await prisma.calendarConnection.update({ where: { id: conn.id }, data: { status: "error", lastError: String(e?.message ?? e).slice(0, 500) } });
      throw e;
    }
  }
}

// ── job dispatch ───────────────────────────────────────────────────────────────
export async function runDueJobs(limit = 25): Promise<{ processed: number; failed: number }> {
  const jobs = await claimDueJobs(limit);
  let failed = 0;
  for (const job of jobs) {
    try {
      const payload = JSON.parse(job.payload || "{}");
      if (job.type === "pull" || job.type === "reconcile") await pull(job.connectionId);
      else if (job.type === "push") await pushAppointment(job.salonId, payload.appointmentId);
      else if (job.type === "watch_renew") await renewWatch(job.connectionId);
      await completeJob(job.id);
    } catch (e: any) {
      failed++;
      const outcome = await failJob(job.id, job.attempts + 1, job.maxAttempts, String(e?.message ?? e));
      await log(job.salonId, job.connectionId, "error", `job_${job.type}_${outcome}`, String(e?.message ?? e));
    }
  }
  return { processed: jobs.length - failed, failed };
}

async function renewWatch(connectionId: string) {
  const conn = await prisma.calendarConnection.findUnique({ where: { id: connectionId } });
  if (!conn) return;
  const provider = getProvider(conn.provider as ProviderId);
  if (!provider.watch) return;
  const ch = await provider.watch(ctxOf(conn), webhookUrl(conn.provider as ProviderId));
  await prisma.calendarChannel.create({ data: { salonId: conn.salonId, connectionId, provider: conn.provider, channelId: ch.channelId, resourceId: ch.resourceId, clientState: ch.clientState, expiresAt: new Date(ch.expiresAt) } });
  await enqueue(conn.salonId, connectionId, "watch_renew", {}, { runAfter: new Date(Date.parse(ch.expiresAt) - 3600e3) });
}

/** Enqueue an outbound mirror for an appointment, but only if the staff has a connected calendar. */
export async function enqueuePush(salonId: string, appointmentId: string) {
  const appt = await prisma.appointment.findFirst({ where: { id: appointmentId, salonId }, select: { staffId: true } });
  if (!appt) return;
  const n = await prisma.calendarConnection.count({ where: { salonId, staffId: appt.staffId, status: "active", direction: { in: ["two_way", "outbound"] } } });
  if (n > 0) await enqueue(salonId, "", "push", { appointmentId });
}

// ── demo helper: simulate an external personal event appearing ─────────────────
export async function simulateExternal(salonId: string, connectionId: string, summary: string, day: number, start: number, durationH: number) {
  const conn = await prisma.calendarConnection.findFirst({ where: { id: connectionId, salonId } });
  if (!conn) throw new Error("connection not found");
  mockProvider.injectExternalEvent(connectionId, { externalId: "ext-" + Math.random().toString(36).slice(2, 10), etag: "etag-" + Math.random().toString(36).slice(2, 8), summary, startsAt: slotToIso(day, start), endsAt: slotToIso(day, start + durationH), cancelled: false });
  await enqueue(salonId, connectionId, "pull");
  await log(salonId, connectionId, "info", "external_event_simulated", summary);
}

// ── webhook ingest (verify + enqueue a pull) ───────────────────────────────────
export async function ingestWebhook(provider: ProviderId, channelId: string, clientState: string): Promise<{ ok: boolean; reason?: string }> {
  const ch = await prisma.calendarChannel.findFirst({ where: { channelId } });
  if (!ch) return { ok: false, reason: "unknown channel" };
  if (ch.clientState && clientState && ch.clientState !== clientState) return { ok: false, reason: "clientState mismatch" }; // reject spoofed notifications
  await enqueue(ch.salonId, ch.connectionId, "pull");
  await log(ch.salonId, ch.connectionId, "info", "webhook", provider);
  return { ok: true };
}

// ── monitoring ─────────────────────────────────────────────────────────────────
export async function syncStatus(salonId: string) {
  const [connections, logs, depth, busyCount] = await Promise.all([
    prisma.calendarConnection.findMany({ where: { salonId }, orderBy: { createdAt: "asc" } }),
    prisma.syncLog.findMany({ where: { salonId }, orderBy: { createdAt: "desc" }, take: 30 }),
    queueDepth(salonId),
    prisma.externalBusyBlock.count({ where: { salonId, cancelled: false } }),
  ]);
  return {
    connections: connections.map((c) => ({ id: c.id, staffId: c.staffId, provider: c.provider, status: c.status, externalAccount: c.externalAccount, lastSyncedAt: c.lastSyncedAt?.toISOString() ?? null, lastError: c.lastError, live: isProviderLive(c.provider as ProviderId) })),
    logs: logs.map((l) => ({ id: l.id, level: l.level, event: l.event, message: l.message, connectionId: l.connectionId, at: l.createdAt.toISOString() })),
    queue: depth,
    externalBusyBlocks: busyCount,
  };
}
