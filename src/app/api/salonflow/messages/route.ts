import { NextResponse } from "next/server";
import { sendMessage } from "@/lib/salonflow/repo";
import { getSalonId } from "@/lib/salonflow/auth";
import type { Message } from "@/app/salonflow/lib/types";

export async function POST(req: Request) {
  const { id, clientId, channel, body, campaignId } = (await req.json()) as { id?: string; clientId: string; channel: Message["channel"]; body: string; campaignId?: string | null };
  if (!clientId || !body) return NextResponse.json({ error: "clientId and body required" }, { status: 400 });
  const m = await sendMessage((await getSalonId()), clientId, channel, body, campaignId, id);
  return NextResponse.json(m, { status: 201 });
}
