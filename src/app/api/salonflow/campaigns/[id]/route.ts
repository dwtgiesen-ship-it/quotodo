import { NextResponse } from "next/server";
import { toggleCampaign } from "@/lib/salonflow/repo";
import { DEMO_SALON_ID } from "@/lib/salonflow/constants";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { active } = (await req.json()) as { active: boolean };
  await toggleCampaign(DEMO_SALON_ID, id, active);
  return NextResponse.json({ ok: true });
}
