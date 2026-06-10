import { NextResponse } from "next/server";
import { cancelMembership } from "@/lib/salonflow/repo";
import { DEMO_SALON_ID } from "@/lib/salonflow/constants";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await cancelMembership(DEMO_SALON_ID, id);
  return NextResponse.json({ ok: true });
}
