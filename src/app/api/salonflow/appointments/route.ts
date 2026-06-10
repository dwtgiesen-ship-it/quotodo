import { NextResponse } from "next/server";
import { book, type BookInput } from "@/lib/salonflow/repo";
import { getSalonId } from "@/lib/salonflow/auth";
import { enqueuePush } from "@/lib/salonflow/sync/service";

export async function POST(req: Request) {
  const body = (await req.json()) as BookInput;
  if (!body.serviceId || !body.staffId || !body.clientId || body.day == null || body.start == null) {
    return NextResponse.json({ ok: false, reason: "Missing booking fields" }, { status: 400 });
  }
  const result = await book((await getSalonId()), body);
  if (result.ok) await enqueuePush((await getSalonId()), result.appointment.id); // mirror to connected calendars
  return NextResponse.json(result, { status: result.ok ? 201 : 409 });
}
