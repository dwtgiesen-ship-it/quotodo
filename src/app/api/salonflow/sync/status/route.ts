import { NextResponse } from "next/server";
import { syncStatus } from "@/lib/salonflow/sync/service";
import { DEMO_SALON_ID } from "@/lib/salonflow/constants";
export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json(await syncStatus(DEMO_SALON_ID));
}
