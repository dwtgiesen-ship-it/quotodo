import { NextResponse } from "next/server";
import { upsertStaff } from "@/lib/salonflow/repo";
import { DEMO_SALON_ID } from "@/lib/salonflow/constants";
import type { Staff } from "@/app/salonflow/lib/types";

export async function POST(req: Request) {
  const body = (await req.json()) as Staff;
  if (!body.id || !body.name) return NextResponse.json({ error: "id and name required" }, { status: 400 });
  const staff = await upsertStaff(DEMO_SALON_ID, body);
  return NextResponse.json(staff);
}
