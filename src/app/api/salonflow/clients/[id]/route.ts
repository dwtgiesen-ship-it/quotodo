import { NextResponse } from "next/server";
import { updateClient } from "@/lib/salonflow/repo";
import { getSalonId } from "@/lib/salonflow/auth";
import type { Client } from "@/app/salonflow/lib/types";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json()) as Partial<Client>;
  await updateClient((await getSalonId()), id, body);
  return NextResponse.json({ ok: true });
}
