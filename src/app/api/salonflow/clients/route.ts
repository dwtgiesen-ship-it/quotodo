import { NextResponse } from "next/server";
import { addClient } from "@/lib/salonflow/repo";
import { getSalonId } from "@/lib/salonflow/auth";
import type { Client } from "@/app/salonflow/lib/types";

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<Client> & { firstName?: string };
  if (!body.firstName) {
    return NextResponse.json({ error: "firstName is required" }, { status: 400 });
  }
  const client = await addClient((await getSalonId()), body as Partial<Client> & { firstName: string });
  return NextResponse.json(client, { status: 201 });
}
