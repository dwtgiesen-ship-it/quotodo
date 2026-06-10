import { NextResponse } from "next/server";
import { upsertStaff } from "@/lib/salonflow/repo";
import { getSalonId } from "@/lib/salonflow/auth";
import type { Staff } from "@/app/salonflow/lib/types";

export async function POST(req: Request) {
  const body = (await req.json()) as Staff;
  if (!body.id || !body.name) return NextResponse.json({ error: "id and name required" }, { status: 400 });
  const staff = await upsertStaff((await getSalonId()), body);
  return NextResponse.json(staff);
}
