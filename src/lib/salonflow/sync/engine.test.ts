import { describe, expect, it } from "vitest";
import { backoffSeconds, planOutbound, reconcileInbound, type EventLink } from "./engine";
import type { ExternalEvent } from "./types";

const ev = (id: string, etag: string, cancelled = false): ExternalEvent => ({ externalId: id, etag, summary: "x", startsAt: "2025-08-13T10:00:00Z", endsAt: "2025-08-13T11:00:00Z", cancelled });

describe("reconcileInbound — echo-loop prevention", () => {
  const links: EventLink[] = [{ externalId: "ours-1", etag: "e1" }];

  it("ignores our own write echoing back (matching etag)", () => {
    const plan = reconcileInbound([ev("ours-1", "e1")], links);
    expect(plan.echoes).toEqual(["ours-1"]);
    expect(plan.busyUpserts).toHaveLength(0);
  });

  it("surfaces our mirror edited externally (link exists, etag differs) without making it a busy block", () => {
    const plan = reconcileInbound([ev("ours-1", "e2")], links);
    expect(plan.ourEdited).toEqual(["ours-1"]);
    expect(plan.busyUpserts).toHaveLength(0);
    expect(plan.echoes).toHaveLength(0);
  });

  it("materializes a 3rd-party event as a busy block", () => {
    const plan = reconcileInbound([ev("personal-9", "z")], links);
    expect(plan.busyUpserts.map((e) => e.externalId)).toEqual(["personal-9"]);
  });

  it("treats a cancelled external event as a cancellation (frees the slot)", () => {
    const plan = reconcileInbound([ev("personal-9", "z", true)], links);
    expect(plan.cancellations).toEqual(["personal-9"]);
    expect(plan.busyUpserts).toHaveLength(0);
  });
});

describe("planOutbound", () => {
  it("creates when active with no existing mirror", () => {
    expect(planOutbound(true, undefined)).toEqual({ action: "create" });
  });
  it("updates when active with an existing mirror", () => {
    expect(planOutbound(true, { externalId: "x", etag: "e" })).toEqual({ action: "update", externalId: "x", etag: "e" });
  });
  it("deletes when inactive (cancelled) with an existing mirror", () => {
    expect(planOutbound(false, { externalId: "x", etag: "e" })).toEqual({ action: "delete", externalId: "x" });
  });
  it("no-ops when inactive with no mirror", () => {
    expect(planOutbound(false, undefined)).toEqual({ action: "noop" });
  });
});

describe("backoffSeconds", () => {
  it("grows with attempt count", () => {
    const a = backoffSeconds(1, 2, 10_000);
    const b = backoffSeconds(5, 2, 10_000);
    expect(b).toBeGreaterThan(a);
  });
  it("is capped", () => {
    expect(backoffSeconds(30, 2, 100)).toBeLessThanOrEqual(100 * 1.2 + 1);
  });
});
