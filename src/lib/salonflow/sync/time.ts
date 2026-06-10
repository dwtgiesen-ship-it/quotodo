// Bridges the demo's week-relative slots (day 0..6, decimal hour) and real
// datetimes. Production stores real ISO datetimes throughout; the demo anchors
// its visible week to a fixed Monday so outbound mirrors are real events and
// inbound events map back onto the grid. Times are treated as UTC in the demo;
// production resolves the salon/location IANA timezone.

// Demo week: day 0 = Wed 13 Aug 2025 .. day 6 = Tue 19 Aug 2025.
const ANCHOR = Date.UTC(2025, 7, 13); // months are 0-indexed
const DAY_MS = 86_400_000;

export function slotToIso(day: number, hour: number): string {
  const ms = ANCHOR + day * DAY_MS + Math.round(hour * 3_600_000);
  return new Date(ms).toISOString();
}

export type DemoCoord = { day: number; start: number; end: number };

/** Map a real interval onto the demo grid; day = -1 if it falls outside the visible week. */
export function isoToSlot(startIso: string, endIso: string): DemoCoord {
  const s = Date.parse(startIso);
  const e = Date.parse(endIso);
  const day = Math.floor((s - ANCHOR) / DAY_MS);
  if (day < 0 || day > 6) return { day: -1, start: 0, end: 0 };
  const dayStartMs = ANCHOR + day * DAY_MS;
  const start = (s - dayStartMs) / 3_600_000;
  const end = (e - dayStartMs) / 3_600_000;
  return { day, start: Number(start.toFixed(4)), end: Number(end.toFixed(4)) };
}
