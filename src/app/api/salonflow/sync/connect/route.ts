import { NextResponse } from "next/server";
import { beginConnect } from "@/lib/salonflow/sync/service";
import { getSalonId } from "@/lib/salonflow/auth";
import type { ProviderId } from "@/lib/salonflow/sync/types";
export async function POST(req: Request) {
  const { staffId, provider } = (await req.json()) as { staffId: string; provider: ProviderId };
  if (!staffId || !provider) return NextResponse.json({ error: "staffId and provider required" }, { status: 400 });
  const res = await beginConnect((await getSalonId()), staffId, provider);
  return NextResponse.json(res, { status: 201 });
}
