import { NextResponse } from "next/server";
import { getState } from "@/lib/salonflow/repo";
import { DEMO_SALON_ID } from "@/lib/salonflow/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  const state = await getState(DEMO_SALON_ID);
  return NextResponse.json(state);
}
