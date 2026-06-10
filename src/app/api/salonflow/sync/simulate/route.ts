import { NextResponse } from "next/server";
import { runDueJobs, simulateExternal, syncStatus } from "@/lib/salonflow/sync/service";
import { DEMO_SALON_ID } from "@/lib/salonflow/constants";
// Demo-only: inject an external "personal" event onto a connected calendar, then
// run the pull pipeline so it immediately becomes unavailability.
export async function POST(req: Request) {
  const { connectionId, summary, day, start, durationH } = (await req.json()) as { connectionId: string; summary?: string; day: number; start: number; durationH?: number };
  await simulateExternal(DEMO_SALON_ID, connectionId, summary ?? "Personal appointment", day, start, durationH ?? 1);
  await runDueJobs();
  return NextResponse.json(await syncStatus(DEMO_SALON_ID));
}
