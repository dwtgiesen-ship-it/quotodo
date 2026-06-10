import { NextResponse } from "next/server";
import { acceptInvitation, createSession } from "@/lib/salonflow/auth";

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { name, password } = (await req.json()) as { name?: string; password?: string };
  if (!password) return NextResponse.json({ ok: false, reason: "Password is required." }, { status: 400 });
  const res = await acceptInvitation(token, name ?? "", password);
  if (!res.ok) return NextResponse.json(res, { status: 409 });
  await createSession(res.user.id);
  return NextResponse.json({ ok: true, user: res.user, redirect: "/salonflow/dashboard" }, { status: 201 });
}
