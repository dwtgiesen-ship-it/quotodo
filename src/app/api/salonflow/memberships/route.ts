import { NextResponse } from "next/server";
import { subscribe } from "@/lib/salonflow/repo";
import { DEMO_SALON_ID } from "@/lib/salonflow/constants";

export async function POST(req: Request) {
  const { id, planId, clientId } = (await req.json()) as { id?: string; planId: string; clientId: string };
  if (!planId || !clientId) return NextResponse.json({ error: "planId and clientId required" }, { status: 400 });
  const m = await subscribe(DEMO_SALON_ID, planId, clientId, id);
  return NextResponse.json(m, { status: 201 });
}
