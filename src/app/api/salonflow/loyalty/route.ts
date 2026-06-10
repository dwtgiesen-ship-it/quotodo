import { NextResponse } from "next/server";
import { addLoyalty } from "@/lib/salonflow/repo";
import { getSalonId } from "@/lib/salonflow/auth";
import type { LoyaltyTransaction } from "@/app/salonflow/lib/types";

export async function POST(req: Request) {
  const { id, clientId, delta, reason, note } = (await req.json()) as { id?: string; clientId: string; delta: number; reason: LoyaltyTransaction["reason"]; note?: string };
  if (!clientId || typeof delta !== "number") return NextResponse.json({ error: "clientId and delta required" }, { status: 400 });
  const t = await addLoyalty((await getSalonId()), clientId, delta, reason, note ?? "", id);
  return NextResponse.json(t, { status: 201 });
}
