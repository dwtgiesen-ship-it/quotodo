import { NextResponse } from "next/server";
import { getState } from "@/lib/salonflow/repo";
import { getSalonId } from "@/lib/salonflow/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const state = await getState((await getSalonId()));
  return NextResponse.json(state);
}
