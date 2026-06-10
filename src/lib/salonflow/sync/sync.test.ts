// End-to-end: an external personal event, once pulled, must block a booking for
// that staff member — the core "double-booking prevention via availability" path.
// Runs against the real DB + the mock provider through the same service code path.

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { book } from "../repo";
import { mockProvider } from "./providers/mock";
import { pull } from "./service";
import { slotToIso } from "./time";

const T = "salon-sync-" + Math.random().toString(36).slice(2, 8);
let connId = "";

beforeAll(async () => {
  await prisma.salon.create({ data: { id: T, name: "SyncTest", slug: T, vertical: "beauty" } });
  await prisma.service.create({ data: { id: `${T}-svc`, salonId: T, name: "Facial", category: "custom", durationMin: 60, priceMinor: 5000 } });
  await prisma.staff.create({ data: { id: `${T}-stf`, salonId: T, name: "Tess", initials: "TS", serviceIds: JSON.stringify([`${T}-svc`]) } });
  await prisma.client.create({ data: { id: `${T}-cl`, salonId: T, firstName: "Cara", since: "2025-01-01" } });
  const conn = await prisma.calendarConnection.create({ data: { salonId: T, staffId: `${T}-stf`, provider: "google", externalAccount: "t@demo", accessToken: "a", refreshToken: "r", status: "active" } });
  connId = conn.id;
});

afterAll(async () => {
  for (const m of [prisma.externalBusyBlock, prisma.externalEventLink, prisma.calendarConnection, prisma.appointment, prisma.client, prisma.staff, prisma.service]) {
    await (m as { deleteMany: (a: unknown) => Promise<unknown> }).deleteMany({ where: { salonId: T } });
  }
  await prisma.salon.deleteMany({ where: { id: T } });
  await prisma.$disconnect();
});

const input = (start: number) => ({ serviceId: `${T}-svc`, staffId: `${T}-stf`, clientId: `${T}-cl`, day: 0, start });

describe("calendar sync → availability", () => {
  it("a pulled external event becomes a busy block on the demo grid", async () => {
    mockProvider.injectExternalEvent(connId, { externalId: "ext-block-1", etag: "e1", summary: "Dentist", startsAt: slotToIso(0, 10), endsAt: slotToIso(0, 11), cancelled: false });
    const res = await pull(connId);
    expect(res.busy).toBe(1);
    const block = await prisma.externalBusyBlock.findFirst({ where: { connectionId: connId, externalId: "ext-block-1" } });
    expect(block?.day).toBe(0);
    expect(block?.start).toBe(10);
  });

  it("prevents a booking that overlaps the external event", async () => {
    const res = await book(T, input(10.5)); // overlaps 10:00–11:00 busy block
    expect(res.ok).toBe(false);
  });

  it("allows a booking outside the busy window", async () => {
    const res = await book(T, input(12));
    expect(res.ok).toBe(true);
  });

  it("ignores our own mirror echoing back (no duplicate busy block)", async () => {
    // simulate an outbound mirror link, then an inbound event with the same etag
    await prisma.externalEventLink.create({ data: { salonId: T, connectionId: connId, appointmentId: "appt-x", externalId: "ours-1", etag: "match" } });
    mockProvider.injectExternalEvent(connId, { externalId: "ours-1", etag: "match", summary: "SalonFlow: Facial", startsAt: slotToIso(0, 14), endsAt: slotToIso(0, 15), cancelled: false });
    await pull(connId);
    const block = await prisma.externalBusyBlock.findFirst({ where: { connectionId: connId, externalId: "ours-1" } });
    expect(block).toBeNull(); // echo suppressed — not turned into unavailability
  });
});
