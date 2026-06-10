// Self-contained email + password auth for SalonFlow. No external provider:
// passwords are hashed with Node's built-in scrypt, sessions are opaque tokens
// stored in the DB and referenced by an httpOnly cookie. Swappable for Clerk
// later — the rest of the app only depends on getSalonId() / getCurrentUser().

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { DEMO_SALON_ID } from "./constants";

const COOKIE = "sf_session";
const SESSION_DAYS = 30;

// ── password hashing ────────────────────────────────────────────────────────
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}
export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

// ── sessions ────────────────────────────────────────────────────────────────
export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400e3);
  await prisma.session.create({ data: { id: token, userId, expiresAt } });
  const jar = await cookies();
  jar.set(COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: SESSION_DAYS * 86400, secure: process.env.NODE_ENV === "production" });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { id: token } });
  jar.delete(COOKIE);
}

export type CurrentUser = { id: string; email: string; name: string; salonId: string; role: string };

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({ where: { id: token } });
  if (!session || session.expiresAt < new Date()) return null;
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return null;
  return { id: user.id, email: user.email, name: user.name, salonId: user.salonId, role: user.role };
}

/** The tenant for the current request: the logged-in user's salon, else the public demo. */
export async function getSalonId(): Promise<string> {
  const user = await getCurrentUser();
  return user?.salonId ?? DEMO_SALON_ID;
}

// ── account creation ──────────────────────────────────────────────────────────
const STARTER_SERVICES = [
  { name: "Consultation", category: "express", durationMin: 30, priceMinor: 0 },
  { name: "Signature service", category: "signature", durationMin: 60, priceMinor: 6000 },
  { name: "Express service", category: "custom", durationMin: 30, priceMinor: 3500 },
];

export type SignupResult = { ok: true; user: CurrentUser } | { ok: false; reason: string };

export async function createAccount(email: string, name: string, password: string): Promise<SignupResult> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalizedEmail)) return { ok: false, reason: "Enter a valid email address." };
  if (password.length < 8) return { ok: false, reason: "Password must be at least 8 characters." };
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) return { ok: false, reason: "An account with that email already exists." };

  const ownerName = name.trim() || normalizedEmail.split("@")[0];
  const salonName = `${ownerName.split(" ")[0]}'s salon`;
  const slug = `${salonName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${randomBytes(3).toString("hex")}`;

  const salon = await prisma.salon.create({ data: { name: salonName, slug, vertical: "beauty", onboardingComplete: false } });
  // owner as a bookable staff member
  const initials = ownerName.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  const staff = await prisma.staff.create({ data: { salonId: salon.id, name: ownerName, initials, role: "owner", serviceIds: "[]" } });
  // a small starter catalog so the app isn't empty on first run
  const serviceIds: string[] = [];
  for (const [i, s] of STARTER_SERVICES.entries()) {
    const svc = await prisma.service.create({ data: { salonId: salon.id, name: s.name, category: s.category, durationMin: s.durationMin, priceMinor: s.priceMinor, sortOrder: i } });
    serviceIds.push(svc.id);
  }
  await prisma.staff.update({ where: { id: staff.id }, data: { serviceIds: JSON.stringify(serviceIds) } });

  const user = await prisma.user.create({ data: { email: normalizedEmail, name: ownerName, passwordHash: hashPassword(password), salonId: salon.id, role: "owner" } });
  return { ok: true, user: { id: user.id, email: user.email, name: user.name, salonId: user.salonId, role: user.role } };
}

export async function authenticate(email: string, password: string): Promise<SignupResult> {
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user || !verifyPassword(password, user.passwordHash)) return { ok: false, reason: "Wrong email or password." };
  return { ok: true, user: { id: user.id, email: user.email, name: user.name, salonId: user.salonId, role: user.role } };
}

// ── staff invitations ──────────────────────────────────────────────────────────
const INVITE_DAYS = 7;

export async function createInvitation(salonId: string, email: string, name: string, role: string) {
  const token = randomBytes(24).toString("hex");
  const inv = await prisma.invitation.create({
    data: { salonId, email: email.trim().toLowerCase(), name: name.trim(), role, token, expiresAt: new Date(Date.now() + INVITE_DAYS * 86400e3) },
  });
  return inv;
}

export async function listInvitations(salonId: string) {
  const rows = await prisma.invitation.findMany({ where: { salonId, status: "pending" }, orderBy: { createdAt: "desc" } });
  return rows.map((i) => ({ id: i.id, email: i.email, name: i.name, role: i.role, token: i.token, expiresAt: i.expiresAt.toISOString() }));
}

export async function revokeInvitation(salonId: string, id: string) {
  await prisma.invitation.updateMany({ where: { id, salonId, status: "pending" }, data: { status: "revoked" } });
}

export async function getInvitation(token: string) {
  const inv = await prisma.invitation.findUnique({ where: { token } });
  if (!inv || inv.status !== "pending" || inv.expiresAt < new Date()) return null;
  const salon = await prisma.salon.findUnique({ where: { id: inv.salonId } });
  return { email: inv.email, name: inv.name, role: inv.role, salonName: salon?.name ?? "the salon" };
}

export async function acceptInvitation(token: string, name: string, password: string): Promise<SignupResult> {
  const inv = await prisma.invitation.findUnique({ where: { token } });
  if (!inv || inv.status !== "pending" || inv.expiresAt < new Date()) return { ok: false, reason: "This invitation is no longer valid." };
  if (password.length < 8) return { ok: false, reason: "Password must be at least 8 characters." };
  const existing = await prisma.user.findUnique({ where: { email: inv.email } });
  if (existing) return { ok: false, reason: "An account with that email already exists. Log in instead." };

  const memberName = name.trim() || inv.name || inv.email.split("@")[0];
  const initials = memberName.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  await prisma.staff.create({ data: { salonId: inv.salonId, name: memberName, initials, role: inv.role, serviceIds: "[]" } });
  const user = await prisma.user.create({ data: { email: inv.email, name: memberName, passwordHash: hashPassword(password), salonId: inv.salonId, role: inv.role } });
  await prisma.invitation.update({ where: { token }, data: { status: "accepted" } });
  return { ok: true, user: { id: user.id, email: user.email, name: user.name, salonId: user.salonId, role: user.role } };
}
