import { NextResponse } from "next/server";
import { createAccount, createSession } from "@/lib/salonflow/auth";

export async function POST(req: Request) {
  const { email, name, password } = (await req.json()) as { email?: string; name?: string; password?: string };
  if (!email || !password) return NextResponse.json({ ok: false, reason: "Email and password are required." }, { status: 400 });
  const res = await createAccount(email, name ?? "", password);
  if (!res.ok) return NextResponse.json(res, { status: 409 });
  await createSession(res.user.id);
  return NextResponse.json({ ok: true, user: res.user, redirect: "/salonflow/onboarding" }, { status: 201 });
}
