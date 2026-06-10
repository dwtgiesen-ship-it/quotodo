import { NextResponse } from "next/server";
import { syncStatus } from "@/lib/salonflow/sync/service";
import { getSalonId } from "@/lib/salonflow/auth";
export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json(await syncStatus((await getSalonId())));
}
