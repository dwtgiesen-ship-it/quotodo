import { NextResponse } from "next/server";
import { addWaitlist } from "@/lib/salonflow/repo";
import { DEMO_SALON_ID } from "@/lib/salonflow/constants";

export async function POST(req: Request) {
  const { id, clientId, serviceId, windowDay } = (await req.json()) as { id?: string; clientId: string; serviceId: string; windowDay: number };
  if (!clientId || !serviceId) return NextResponse.json({ error: "clientId and serviceId required" }, { status: 400 });
  const w = await addWaitlist(DEMO_SALON_ID, clientId, serviceId, windowDay ?? -1, id);
  return NextResponse.json(w, { status: 201 });
}
