import { NextResponse } from "next/server";
import { sendMessage } from "@/lib/salonflow/repo";
import { DEMO_SALON_ID } from "@/lib/salonflow/constants";
import type { Message } from "@/app/salonflow/lib/types";

export async function POST(req: Request) {
  const { id, clientId, channel, body, campaignId } = (await req.json()) as { id?: string; clientId: string; channel: Message["channel"]; body: string; campaignId?: string | null };
  if (!clientId || !body) return NextResponse.json({ error: "clientId and body required" }, { status: 400 });
  const m = await sendMessage(DEMO_SALON_ID, clientId, channel, body, campaignId, id);
  return NextResponse.json(m, { status: 201 });
}
