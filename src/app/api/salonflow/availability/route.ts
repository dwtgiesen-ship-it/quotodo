import { NextResponse } from "next/server";
import { availability } from "@/lib/salonflow/repo";
import { DEMO_SALON_ID } from "@/lib/salonflow/constants";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const serviceId = url.searchParams.get("serviceId");
  const staffId = url.searchParams.get("staffId");
  const day = Number(url.searchParams.get("day"));
  if (!serviceId || !staffId || Number.isNaN(day)) {
    return NextResponse.json({ error: "serviceId, staffId, day are required" }, { status: 400 });
  }
  const slots = await availability(DEMO_SALON_ID, serviceId, staffId, day);
  return NextResponse.json({ slots });
}
