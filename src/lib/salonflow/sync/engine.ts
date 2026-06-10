// Pure sync logic — no I/O, fully unit-tested in engine.test.ts. This is the
// heart of the two-way engine: it classifies inbound changes (preventing
// echo loops) and plans outbound writes by appointment state.

import type { ExternalEvent } from "./types";

export type EventLink = { externalId: string; etag: string };

export type InboundPlan = {
  /** External (not-ours) events to materialize as availability "busy" blocks. */
  busyUpserts: ExternalEvent[];
  /** External ids to mark cancelled (freeing the slot). */
  cancellations: string[];
  /** Our own writes coming back — ignored to break echo loops. */
  echoes: string[];
  /** Our mirror events edited directly in the external calendar — surfaced, not applied as busy. */
  ourEdited: string[];
};

/**
 * Classify a batch of inbound external events against our outbound mirror links.
 *
 * Echo-loop prevention: when we push an appointment we store the resulting
 * (externalId, etag). The provider then notifies us of that very change. If the
 * inbound etag matches the one we stored, it is our own write returning — skip it.
 */
export function reconcileInbound(events: ExternalEvent[], links: EventLink[]): InboundPlan {
  const linkByExt = new Map(links.map((l) => [l.externalId, l]));
  const plan: InboundPlan = { busyUpserts: [], cancellations: [], echoes: [], ourEdited: [] };

  for (const ev of events) {
    const link = linkByExt.get(ev.externalId);
    if (link) {
      // This external event corresponds to one of OUR appointments.
      if (ev.etag === link.etag) plan.echoes.push(ev.externalId); // our write echoing back
      else plan.ourEdited.push(ev.externalId); // someone edited our mirror externally
      continue;
    }
    // A personal/3rd-party event — affects availability.
    if (ev.cancelled) plan.cancellations.push(ev.externalId);
    else plan.busyUpserts.push(ev);
  }
  return plan;
}

export type OutboundAction =
  | { action: "noop" }
  | { action: "create" }
  | { action: "update"; externalId: string; etag: string }
  | { action: "delete"; externalId: string };

/**
 * Decide what to push for one appointment given whether a mirror already exists.
 * `active` = appointment is in a state that should appear on the external calendar.
 */
export function planOutbound(active: boolean, link: EventLink | undefined): OutboundAction {
  if (active) {
    if (!link) return { action: "create" };
    return { action: "update", externalId: link.externalId, etag: link.etag };
  }
  if (link) return { action: "delete", externalId: link.externalId };
  return { action: "noop" };
}

/** Exponential backoff with jitter for the retry queue (seconds). */
export function backoffSeconds(attempt: number, base = 2, cap = 3600): number {
  const exp = Math.min(cap, base ** attempt);
  const jitter = exp * 0.2 * Math.random();
  return Math.round(exp + jitter);
}
