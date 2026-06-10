import { NextResponse } from "next/server";
import { runDueJobs } from "@/lib/salonflow/sync/service";
// Processes due jobs. In production a cron/worker calls this continuously; in the
// demo the dashboard triggers it. Idempotent and safe to call repeatedly.
export async function POST() {
  return NextResponse.json(await runDueJobs());
}
