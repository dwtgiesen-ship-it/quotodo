import { NextResponse } from "next/server";
import { updateSettings } from "@/lib/salonflow/repo";
import { DEMO_SALON_ID } from "@/lib/salonflow/constants";
import type { SalonSettings } from "@/app/salonflow/lib/types";

export async function PATCH(req: Request) {
  const body = (await req.json()) as Partial<SalonSettings>;
  await updateSettings(DEMO_SALON_ID, body);
  return NextResponse.json({ ok: true });
}
