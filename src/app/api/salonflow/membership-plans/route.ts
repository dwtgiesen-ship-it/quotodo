import { NextResponse } from "next/server";
import { upsertPlan } from "@/lib/salonflow/repo";
import { getSalonId } from "@/lib/salonflow/auth";
import type { MembershipPlan } from "@/app/salonflow/lib/types";

export async function POST(req: Request) {
  const body = (await req.json()) as MembershipPlan;
  if (!body.id || !body.name) return NextResponse.json({ error: "id and name required" }, { status: 400 });
  const p = await upsertPlan((await getSalonId()), body);
  return NextResponse.json(p);
}
