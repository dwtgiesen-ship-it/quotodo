import { NextResponse } from "next/server";
import { moveAppointment, setStatus } from "@/lib/salonflow/repo";
import { getSalonId } from "@/lib/salonflow/auth";
import { enqueuePush } from "@/lib/salonflow/sync/service";
import type { Appointment } from "@/app/salonflow/lib/types";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json()) as { day?: number; start?: number; status?: Appointment["status"] };
  if (body.status) {
    await setStatus((await getSalonId()), id, body.status);
    await enqueuePush((await getSalonId()), id);
    return NextResponse.json({ ok: true });
  }
  if (body.day != null && body.start != null) {
    const result = await moveAppointment((await getSalonId()), id, body.day, body.start);
    if (result.ok) await enqueuePush((await getSalonId()), id);
    return NextResponse.json(result, { status: result.ok ? 200 : 409 });
  }
  return NextResponse.json({ ok: false, reason: "Nothing to update" }, { status: 400 });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await setStatus((await getSalonId()), id, "cancelled");
  await enqueuePush((await getSalonId()), id); // removes the external mirror
  return NextResponse.json({ ok: true });
}
