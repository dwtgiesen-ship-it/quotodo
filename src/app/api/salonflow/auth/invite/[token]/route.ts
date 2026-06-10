import { NextResponse } from "next/server";
import { getInvitation } from "@/lib/salonflow/auth";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const inv = await getInvitation(token);
  if (!inv) return NextResponse.json({ valid: false }, { status: 404 });
  return NextResponse.json({ valid: true, ...inv });
}
