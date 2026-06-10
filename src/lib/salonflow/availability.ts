// Pure scheduling logic shared by the API and the UI. No I/O — unit-tested in
// src/lib/salonflow/availability.test.ts.

export const DAY_START = 9;
export const DAY_END = 20.5;

export type Slotable = { day: number; start: number; end: number; staffId: string; status: string };

export function overlaps(a: { start: number; end: number }, b: { start: number; end: number }): boolean {
  return a.start < b.end && b.start < a.end;
}

/** True if [start,end) on `day` for `staffId` collides with an existing active appointment. */
export function hasConflict(
  existing: Slotable[],
  candidate: { day: number; start: number; end: number; staffId: string },
  ignorePredicate?: (a: Slotable) => boolean,
): boolean {
  return existing.some(
    (a) =>
      a.staffId === candidate.staffId &&
      a.day === candidate.day &&
      a.status !== "cancelled" &&
      !(ignorePredicate?.(a) ?? false) &&
      overlaps(candidate, a),
  );
}

/** Bookable start times (decimal hours) for a service of `durationMin` with `staffId` on `day`. */
export function computeSlots(
  existing: Slotable[],
  opts: { day: number; staffId: string; durationMin: number; step?: number },
): number[] {
  const dur = opts.durationMin / 60;
  const step = opts.step ?? 0.5;
  const out: number[] = [];
  for (let t = DAY_START; t + dur <= DAY_END + 1e-9; t += step) {
    if (!hasConflict(existing, { day: opts.day, start: t, end: t + dur, staffId: opts.staffId })) {
      out.push(Number(t.toFixed(2)));
    }
  }
  return out;
}
