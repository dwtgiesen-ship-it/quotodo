import { NextResponse } from "next/server";
import { cancelMembership } from "@/lib/salonflow/repo";
import { getSalonId } from "@/lib/salonflow/auth";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await cancelMembership((await getSalonId()), id);
  return NextResponse.json({ ok: true });
}
