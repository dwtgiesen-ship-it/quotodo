import { NextResponse } from "next/server";
import { disconnect } from "@/lib/salonflow/sync/service";
import { DEMO_SALON_ID } from "@/lib/salonflow/constants";
export async function POST(req: Request) {
  const { connectionId } = (await req.json()) as { connectionId: string };
  await disconnect(DEMO_SALON_ID, connectionId);
  return NextResponse.json({ ok: true });
}
