import { NextResponse } from "next/server";
import { upsertService } from "@/lib/salonflow/repo";
import { DEMO_SALON_ID } from "@/lib/salonflow/constants";
import type { Service } from "@/app/salonflow/lib/types";

export async function POST(req: Request) {
  const body = (await req.json()) as Service;
  if (!body.id || !body.name) {
    return NextResponse.json({ error: "id and name are required" }, { status: 400 });
  }
  const service = await upsertService(DEMO_SALON_ID, body);
  return NextResponse.json(service, { status: 200 });
}
