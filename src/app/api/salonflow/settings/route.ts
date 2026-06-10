import { NextResponse } from "next/server";
import { updateSettings } from "@/lib/salonflow/repo";
import { getSalonId } from "@/lib/salonflow/auth";
import type { SalonSettings } from "@/app/salonflow/lib/types";

export async function PATCH(req: Request) {
  const body = (await req.json()) as Partial<SalonSettings>;
  await updateSettings((await getSalonId()), body);
  return NextResponse.json({ ok: true });
}
