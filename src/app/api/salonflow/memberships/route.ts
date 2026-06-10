import { NextResponse } from "next/server";
import { subscribe } from "@/lib/salonflow/repo";
import { getSalonId } from "@/lib/salonflow/auth";

export async function POST(req: Request) {
  const { id, planId, clientId } = (await req.json()) as { id?: string; planId: string; clientId: string };
  if (!planId || !clientId) return NextResponse.json({ error: "planId and clientId required" }, { status: 400 });
  const m = await subscribe((await getSalonId()), planId, clientId, id);
  return NextResponse.json(m, { status: 201 });
}
