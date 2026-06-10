import { NextResponse } from "next/server";
import { toggleCampaign } from "@/lib/salonflow/repo";
import { getSalonId } from "@/lib/salonflow/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { active } = (await req.json()) as { active: boolean };
  await toggleCampaign((await getSalonId()), id, active);
  return NextResponse.json({ ok: true });
}
