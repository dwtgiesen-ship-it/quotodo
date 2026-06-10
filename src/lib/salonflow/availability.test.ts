import { describe, expect, it } from "vitest";
import { computeSlots, hasConflict, overlaps, type Slotable, DAY_START, DAY_END } from "./availability";

const appt = (day: number, start: number, end: number, staffId = "a", status = "booked"): Slotable => ({ day, start, end, staffId, status });

describe("overlaps", () => {
  it("detects overlapping ranges", () => {
    expect(overlaps({ start: 10, end: 11 }, { start: 10.5, end: 11.5 })).toBe(true);
  });
  it("treats touching ranges as non-overlapping (back-to-back bookings allowed)", () => {
    expect(overlaps({ start: 10, end: 11 }, { start: 11, end: 12 })).toBe(false);
  });
  it("non-overlapping ranges return false", () => {
    expect(overlaps({ start: 10, end: 11 }, { start: 12, end: 13 })).toBe(false);
  });
});

describe("hasConflict", () => {
  const existing = [appt(2, 14, 15, "andre"), appt(2, 16, 17, "andre"), appt(2, 14, 15, "mia")];

  it("flags an overlapping slot for the same staff/day", () => {
    expect(hasConflict(existing, { day: 2, start: 14.5, end: 15.5, staffId: "andre" })).toBe(true);
  });
  it("allows a free slot for the same staff/day", () => {
    expect(hasConflict(existing, { day: 2, start: 15, end: 16, staffId: "andre" })).toBe(false);
  });
  it("does not conflict across different staff", () => {
    expect(hasConflict(existing, { day: 2, start: 14, end: 15, staffId: "jo" })).toBe(false);
  });
  it("does not conflict across different days", () => {
    expect(hasConflict(existing, { day: 3, start: 14, end: 15, staffId: "andre" })).toBe(false);
  });
  it("ignores cancelled appointments", () => {
    const withCancelled = [appt(2, 14, 15, "andre", "cancelled")];
    expect(hasConflict(withCancelled, { day: 2, start: 14, end: 15, staffId: "andre" })).toBe(false);
  });
  it("honors the ignore predicate (used when moving an appointment onto itself)", () => {
    const same = appt(2, 14, 15, "andre");
    expect(hasConflict([same], { day: 2, start: 14, end: 15, staffId: "andre" }, (a) => a === same)).toBe(false);
  });
});

describe("computeSlots", () => {
  it("returns no slots when the staff member is fully booked all day", () => {
    const fullyBooked: Slotable[] = [];
    for (let t = DAY_START; t < DAY_END; t += 1) fullyBooked.push(appt(0, t, t + 1, "andre"));
    expect(computeSlots(fullyBooked, { day: 0, staffId: "andre", durationMin: 60 })).toHaveLength(0);
  });

  it("excludes slots that would overlap an existing booking", () => {
    const existing = [appt(0, 13, 14, "andre")];
    const slots = computeSlots(existing, { day: 0, staffId: "andre", durationMin: 60, step: 0.5 });
    // a 60-min service can't start at 12.5, 13, or 13.5 (would overlap 13–14)
    expect(slots).not.toContain(12.5);
    expect(slots).not.toContain(13);
    expect(slots).not.toContain(13.5);
    // but 14 (back-to-back) is fine
    expect(slots).toContain(14);
  });

  it("never proposes a slot whose end exceeds the working day", () => {
    const slots = computeSlots([], { day: 0, staffId: "andre", durationMin: 90 });
    const last = slots[slots.length - 1];
    expect(last + 1.5).toBeLessThanOrEqual(DAY_END + 1e-9);
  });

  it("a longer service yields fewer slots than a shorter one", () => {
    const short = computeSlots([], { day: 0, staffId: "andre", durationMin: 45 });
    const long = computeSlots([], { day: 0, staffId: "andre", durationMin: 120 });
    expect(long.length).toBeLessThan(short.length);
  });
});
