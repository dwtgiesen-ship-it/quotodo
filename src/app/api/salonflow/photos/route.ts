import { NextResponse } from "next/server";
import { addPhoto } from "@/lib/salonflow/repo";
import { getSalonId } from "@/lib/salonflow/auth";
import type { CustomerPhoto } from "@/app/salonflow/lib/types";

export async function POST(req: Request) {
  const { id, clientId, url, kind } = (await req.json()) as { id?: string; clientId: string; url: string; kind: CustomerPhoto["kind"] };
  if (!clientId || !url) return NextResponse.json({ error: "clientId and url required" }, { status: 400 });
  const p = await addPhoto((await getSalonId()), clientId, url, kind ?? "reference", id);
  return NextResponse.json(p, { status: 201 });
}
