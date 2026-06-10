import { NextResponse } from "next/server";
import { authenticate, createSession } from "@/lib/salonflow/auth";

export async function POST(req: Request) {
  const { email, password } = (await req.json()) as { email?: string; password?: string };
  if (!email || !password) return NextResponse.json({ ok: false, reason: "Email and password are required." }, { status: 400 });
  const res = await authenticate(email, password);
  if (!res.ok) return NextResponse.json(res, { status: 401 });
  await createSession(res.user.id);
  return NextResponse.json({ ok: true, user: res.user, redirect: "/salonflow/dashboard" });
}
