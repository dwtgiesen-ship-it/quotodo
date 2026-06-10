import { NextResponse } from "next/server";
import { updateClient } from "@/lib/salonflow/repo";
import { DEMO_SALON_ID } from "@/lib/salonflow/constants";
import type { Client } from "@/app/salonflow/lib/types";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json()) as Partial<Client>;
  await updateClient(DEMO_SALON_ID, id, body);
  return NextResponse.json({ ok: true });
}
