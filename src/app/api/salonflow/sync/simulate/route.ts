import { NextResponse } from "next/server";
import { runDueJobs, simulateExternal, syncStatus } from "@/lib/salonflow/sync/service";
import { getSalonId } from "@/lib/salonflow/auth";
// Demo-only: inject an external "personal" event onto a connected calendar, then
// run the pull pipeline so it immediately becomes unavailability.
export async function POST(req: Request) {
  const { connectionId, summary, day, start, durationH } = (await req.json()) as { connectionId: string; summary?: string; day: number; start: number; durationH?: number };
  await simulateExternal((await getSalonId()), connectionId, summary ?? "Personal appointment", day, start, durationH ?? 1);
  await runDueJobs();
  return NextResponse.json(await syncStatus((await getSalonId())));
}
