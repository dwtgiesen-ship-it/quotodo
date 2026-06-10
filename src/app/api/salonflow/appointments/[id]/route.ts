import { NextResponse } from "next/server";
import { moveAppointment, setStatus } from "@/lib/salonflow/repo";
import { DEMO_SALON_ID } from "@/lib/salonflow/constants";
import { enqueuePush } from "@/lib/salonflow/sync/service";
import type { Appointment } from "@/app/salonflow/lib/types";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json()) as { day?: number; start?: number; status?: Appointment["status"] };
  if (body.status) {
    await setStatus(DEMO_SALON_ID, id, body.status);
    await enqueuePush(DEMO_SALON_ID, id);
    return NextResponse.json({ ok: true });
  }
  if (body.day != null && body.start != null) {
    const result = await moveAppointment(DEMO_SALON_ID, id, body.day, body.start);
    if (result.ok) await enqueuePush(DEMO_SALON_ID, id);
    return NextResponse.json(result, { status: result.ok ? 200 : 409 });
  }
  return NextResponse.json({ ok: false, reason: "Nothing to update" }, { status: 400 });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await setStatus(DEMO_SALON_ID, id, "cancelled");
  await enqueuePush(DEMO_SALON_ID, id); // removes the external mirror
  return NextResponse.json({ ok: true });
}
