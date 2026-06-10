// Integration tests for the repo layer against the real Prisma/SQLite database.
// Uses a throwaway tenant id so it never touches demo data; cleans up after itself.

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { book, getState, moveAppointment, setStatus } from "./repo";

const T = "salon-test-" + Math.random().toString(36).slice(2, 8);

beforeAll(async () => {
  await prisma.salon.create({ data: { id: T, name: "Test", slug: T, vertical: "beauty" } });
  await prisma.service.create({ data: { id: `${T}-svc`, salonId: T, name: "Facial", category: "custom", durationMin: 60, priceMinor: 5000 } });
  await prisma.staff.create({ data: { id: `${T}-stf`, salonId: T, name: "Tess", initials: "TS", role: "staff", serviceIds: JSON.stringify([`${T}-svc`]) } });
  await prisma.client.create({ data: { id: `${T}-cl`, salonId: T, firstName: "Cara", since: "2025-01-01" } });
});

afterAll(async () => {
  await prisma.appointment.deleteMany({ where: { salonId: T } });
  await prisma.client.deleteMany({ where: { salonId: T } });
  await prisma.staff.deleteMany({ where: { salonId: T } });
  await prisma.service.deleteMany({ where: { salonId: T } });
  await prisma.salon.deleteMany({ where: { id: T } });
  await prisma.$disconnect();
});

const input = (start: number, id?: string) => ({ id, serviceId: `${T}-svc`, staffId: `${T}-stf`, clientId: `${T}-cl`, day: 0, start });

describe("repo.book (DB)", () => {
  it("books an appointment and computes the end from service duration", async () => {
    const res = await book(T, input(10, "ap-a"));
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.appointment.end).toBe(11);
  });

  it("rejects an overlapping slot for the same staff with a 409-style reason", async () => {
    const res = await book(T, input(10.5, "ap-b"));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toMatch(/conflict/i);
  });

  it("is idempotent: replaying the same id returns the original, not a duplicate", async () => {
    const again = await book(T, input(10, "ap-a"));
    expect(again.ok).toBe(true);
    const state = await getState(T);
    expect(state.appointments.filter((a) => a.id === "ap-a")).toHaveLength(1);
  });

  it("allows a back-to-back slot once the first booking ends", async () => {
    const res = await book(T, input(11, "ap-c"));
    expect(res.ok).toBe(true);
  });
});

describe("repo mutations (DB)", () => {
  it("moves an appointment when the target slot is free", async () => {
    const res = await moveAppointment(T, "ap-c", 0, 13);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.appointment.start).toBe(13);
  });

  it("cancelling frees the slot so it no longer conflicts", async () => {
    await setStatus(T, "ap-a", "cancelled");
    const res = await book(T, input(10, "ap-d"));
    expect(res.ok).toBe(true);
  });

  it("getState returns the tenant's data only", async () => {
    const state = await getState(T);
    expect(state.settings.name).toBe("Test");
    expect(state.services).toHaveLength(1);
    expect(state.staff).toHaveLength(1);
  });
});
