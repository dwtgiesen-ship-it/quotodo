import { NextResponse } from "next/server";
import { disconnect } from "@/lib/salonflow/sync/service";
import { getSalonId } from "@/lib/salonflow/auth";
export async function POST(req: Request) {
  const { connectionId } = (await req.json()) as { connectionId: string };
  await disconnect((await getSalonId()), connectionId);
  return NextResponse.json({ ok: true });
}
