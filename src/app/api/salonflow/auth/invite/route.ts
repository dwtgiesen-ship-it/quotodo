import { NextResponse } from "next/server";
import { createInvitation, getCurrentUser, listInvitations, revokeInvitation } from "@/lib/salonflow/auth";

async function requireManager() {
  const user = await getCurrentUser();
  if (!user || !(user.role === "owner" || user.role === "manager")) return null;
  return user;
}

export async function POST(req: Request) {
  const user = await requireManager();
  if (!user) return NextResponse.json({ ok: false, reason: "Only an owner or manager can invite team members." }, { status: 403 });
  const { email, name, role } = (await req.json()) as { email?: string; name?: string; role?: string };
  if (!email) return NextResponse.json({ ok: false, reason: "Email is required." }, { status: 400 });
  const inv = await createInvitation(user.salonId, email, name ?? "", role === "manager" || role === "receptionist" ? role : "staff");
  return NextResponse.json({ ok: true, token: inv.token }, { status: 201 });
}

export async function GET() {
  const user = await requireManager();
  if (!user) return NextResponse.json({ invitations: [] });
  return NextResponse.json({ invitations: await listInvitations(user.salonId) });
}

export async function DELETE(req: Request) {
  const user = await requireManager();
  if (!user) return NextResponse.json({ ok: false }, { status: 403 });
  const id = new URL(req.url).searchParams.get("id");
  if (id) await revokeInvitation(user.salonId, id);
  return NextResponse.json({ ok: true });
}
