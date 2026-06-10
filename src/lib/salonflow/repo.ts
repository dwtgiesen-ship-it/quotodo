// Server-side data access for SalonFlow. Serializes Prisma rows into the DTO shapes
// the front-end uses (src/app/salonflow/lib/types.ts) and implements the mutations
// that, in production, map to the REST endpoints in docs/salonflow/04-api-and-auth.md.

import { prisma } from "@/lib/prisma";
import type {
  Appointment,
  Campaign,
  Client,
  CustomerPhoto,
  LoyaltyTransaction,
  MembershipPlan,
  MembershipUser,
  Message,
  SalonState,
  Service,
  Staff,
  WaitlistEntry,
  WeeklyHours,
} from "@/app/salonflow/lib/types";
import { computeSlots, hasConflict, type Slotable } from "./availability";

const parse = <T>(s: string, fallback: T): T => {
  try { return JSON.parse(s) as T; } catch { return fallback; }
};

// ── serializers ───────────────────────────────────────────────────────────────
/* eslint-disable @typescript-eslint/no-explicit-any */
const toService = (r: any): Service => ({ id: r.id, name: r.name, category: r.category, durationMin: r.durationMin, priceMinor: r.priceMinor, depositMinor: r.depositMinor, bookableOnline: r.bookableOnline });
const toStaff = (r: any): Staff => ({ id: r.id, name: r.name, initials: r.initials, color: r.color, role: r.role, bookableOnline: r.bookableOnline, serviceIds: parse(r.serviceIds, []), weeklyHours: parse(r.weeklyHours, {}) });
const toClient = (r: any): Client => ({ id: r.id, firstName: r.firstName, lastName: r.lastName, email: r.email, phone: r.phone, notes: r.notes, since: r.since, totalSpendMinor: r.totalSpendMinor, loyaltyPoints: r.loyaltyPoints, tier: r.tier, tags: parse(r.tags, []), profileType: r.profileType, profileData: parse(r.profileData, {}) });
const toAppt = (r: any): Appointment => ({ id: r.id, day: r.day, start: r.start, end: r.end, serviceId: r.serviceId, staffId: r.staffId, clientId: r.clientId, status: r.status, source: r.source, isNew: r.isNew, starred: r.starred });
const toPlan = (r: any): MembershipPlan => ({ id: r.id, name: r.name, priceMinor: r.priceMinor, interval: r.interval, includedServices: parse(r.includedServices, []), discountPct: r.discountPct, loyaltyMultiplier: r.loyaltyMultiplier, active: r.active });
const toMembership = (r: any): MembershipUser => ({ id: r.id, planId: r.planId, clientId: r.clientId, status: r.status, renewsAt: r.renewsAt });
const toLoyalty = (r: any): LoyaltyTransaction => ({ id: r.id, clientId: r.clientId, delta: r.delta, reason: r.reason, note: r.note, createdAt: typeof r.createdAt === "string" ? r.createdAt : r.createdAt.toISOString().slice(0, 10) });
const toCampaign = (r: any): Campaign => ({ id: r.id, type: r.type, channel: r.channel, template: r.template, triggerOffsetMin: r.triggerOffsetMin, active: r.active });
const toMessage = (r: any): Message => ({ id: r.id, campaignId: r.campaignId, clientId: r.clientId, channel: r.channel, status: r.status, body: r.body, createdAt: typeof r.createdAt === "string" ? r.createdAt : r.createdAt.toISOString().slice(0, 10) });
const toWaitlist = (r: any): WaitlistEntry => ({ id: r.id, clientId: r.clientId, serviceId: r.serviceId, windowDay: r.windowDay, filledAt: r.filledAt ? (typeof r.filledAt === "string" ? r.filledAt : r.filledAt.toISOString()) : null });
const toPhoto = (r: any): CustomerPhoto => ({ id: r.id, clientId: r.clientId, url: r.url, kind: r.kind });
/* eslint-enable @typescript-eslint/no-explicit-any */

// ── reads ──────────────────────────────────────────────────────────────────────
export async function getState(salonId: string): Promise<SalonState> {
  const [salon, services, staff, clients, appts, plans, memberships, loyalty, campaigns, messages, waitlist, photos] = await Promise.all([
    prisma.salon.findUnique({ where: { id: salonId } }),
    prisma.service.findMany({ where: { salonId }, orderBy: { sortOrder: "asc" } }),
    prisma.staff.findMany({ where: { salonId, archived: false } }),
    prisma.client.findMany({ where: { salonId }, orderBy: { firstName: "asc" } }),
    prisma.appointment.findMany({ where: { salonId } }),
    prisma.membershipPlan.findMany({ where: { salonId }, orderBy: { sortOrder: "asc" } }),
    prisma.membershipUser.findMany({ where: { salonId } }),
    prisma.loyaltyTransaction.findMany({ where: { salonId }, orderBy: { createdAt: "desc" } }),
    prisma.campaign.findMany({ where: { salonId } }),
    prisma.message.findMany({ where: { salonId }, orderBy: { createdAt: "desc" } }),
    prisma.waitlistEntry.findMany({ where: { salonId } }),
    prisma.customerPhoto.findMany({ where: { salonId } }),
  ]);
  if (!salon) throw new Error("Salon not found");
  return {
    settings: {
      name: salon.name,
      vertical: salon.vertical as SalonState["settings"]["vertical"],
      currency: salon.currency,
      timezone: salon.timezone,
      onboardingComplete: salon.onboardingComplete,
      calendarConnected: salon.calendarConnected,
      weeklyHours: parse<WeeklyHours>(salon.weeklyHours, {}),
    },
    services: services.map(toService),
    staff: staff.map(toStaff),
    clients: clients.map(toClient),
    appointments: appts.map(toAppt),
    membershipPlans: plans.map(toPlan),
    memberships: memberships.map(toMembership),
    loyaltyLedger: loyalty.map(toLoyalty),
    campaigns: campaigns.map(toCampaign),
    messages: messages.map(toMessage),
    waitlist: waitlist.map(toWaitlist),
    photos: photos.map(toPhoto),
  };
}

async function activeAppointments(salonId: string): Promise<Slotable[]> {
  const [rows, busy] = await Promise.all([
    prisma.appointment.findMany({ where: { salonId, NOT: { status: "cancelled" } } }),
    // Externally-synced "busy" blocks (personal events from connected calendars)
    // count as unavailability for that staff member — preventing double-booking.
    prisma.externalBusyBlock.findMany({ where: { salonId, cancelled: false, day: { gte: 0 } } }),
  ]);
  return [
    ...rows.map((r) => ({ day: r.day, start: r.start, end: r.end, staffId: r.staffId, status: r.status })),
    ...busy.map((b) => ({ day: b.day, start: b.start, end: b.end, staffId: b.staffId, status: "external" })),
  ];
}

export async function availability(salonId: string, serviceId: string, staffId: string, day: number): Promise<number[]> {
  const service = await prisma.service.findFirst({ where: { id: serviceId, salonId } });
  if (!service) return [];
  const existing = await activeAppointments(salonId);
  return computeSlots(existing, { day, staffId, durationMin: service.durationMin });
}

// ── appointments ────────────────────────────────────────────────────────────
export type BookInput = { id?: string; serviceId: string; staffId: string; clientId: string; day: number; start: number; source?: Appointment["source"] };
export type BookResult = { ok: true; appointment: Appointment } | { ok: false; reason: string };

export async function book(salonId: string, input: BookInput): Promise<BookResult> {
  if (input.id) {
    const dupe = await prisma.appointment.findUnique({ where: { id: input.id } });
    if (dupe) return { ok: true, appointment: toAppt(dupe) };
  }
  const service = await prisma.service.findFirst({ where: { id: input.serviceId, salonId } });
  if (!service) return { ok: false, reason: "Unknown service" };
  const end = Number((input.start + service.durationMin / 60).toFixed(4));
  const existing = await activeAppointments(salonId);
  if (hasConflict(existing, { day: input.day, start: input.start, end, staffId: input.staffId })) {
    return { ok: false, reason: "That time conflicts with another appointment for this staff member." };
  }
  const row = await prisma.appointment.create({
    data: { ...(input.id ? { id: input.id } : {}), salonId, day: input.day, start: input.start, end, serviceId: input.serviceId, staffId: input.staffId, clientId: input.clientId, status: "booked", source: input.source ?? "dashboard", isNew: true },
  });
  return { ok: true, appointment: toAppt(row) };
}

export async function moveAppointment(salonId: string, id: string, day: number, start: number): Promise<BookResult> {
  const appt = await prisma.appointment.findFirst({ where: { id, salonId } });
  if (!appt) return { ok: false, reason: "Not found" };
  const end = Number((start + (appt.end - appt.start)).toFixed(4));
  const existing = await activeAppointments(salonId);
  if (hasConflict(existing, { day, start, end, staffId: appt.staffId }, (a) => a.day === appt.day && a.start === appt.start && a.staffId === appt.staffId)) {
    return { ok: false, reason: "Conflict — slot is taken." };
  }
  const row = await prisma.appointment.update({ where: { id }, data: { day, start, end } });
  return { ok: true, appointment: toAppt(row) };
}

export async function setStatus(salonId: string, id: string, status: Appointment["status"]): Promise<void> {
  await prisma.appointment.updateMany({ where: { id, salonId }, data: { status } });
}

// ── clients ──────────────────────────────────────────────────────────────────
export async function addClient(salonId: string, data: Partial<Client> & { firstName: string }): Promise<Client> {
  const row = await prisma.client.create({
    data: {
      ...(data.id ? { id: data.id } : {}), salonId,
      firstName: data.firstName, lastName: data.lastName ?? "", email: data.email ?? "", phone: data.phone ?? "",
      notes: data.notes ?? "", since: data.since ?? new Date().toISOString().slice(0, 10),
      totalSpendMinor: data.totalSpendMinor ?? 0, loyaltyPoints: data.loyaltyPoints ?? 0, tier: data.tier ?? "standard",
      tags: JSON.stringify(data.tags ?? ["New"]), profileType: data.profileType ?? "generic", profileData: JSON.stringify(data.profileData ?? {}),
    },
  });
  return toClient(row);
}

export async function updateClient(salonId: string, id: string, patch: Partial<Client>): Promise<void> {
  const data: Record<string, unknown> = {};
  for (const k of ["firstName", "lastName", "email", "phone", "notes", "tier", "profileType"] as const) if (patch[k] !== undefined) data[k] = patch[k];
  if (patch.tags !== undefined) data.tags = JSON.stringify(patch.tags);
  if (patch.profileData !== undefined) data.profileData = JSON.stringify(patch.profileData);
  if (Object.keys(data).length) await prisma.client.updateMany({ where: { id, salonId }, data });
}

// ── services ─────────────────────────────────────────────────────────────────
export async function upsertService(salonId: string, s: Service): Promise<Service> {
  const data = { name: s.name, category: s.category, durationMin: s.durationMin, priceMinor: s.priceMinor, depositMinor: s.depositMinor, bookableOnline: s.bookableOnline };
  const existing = await prisma.service.findFirst({ where: { id: s.id, salonId } });
  const row = existing ? await prisma.service.update({ where: { id: s.id }, data }) : await prisma.service.create({ data: { id: s.id, salonId, ...data } });
  return toService(row);
}
export async function removeService(salonId: string, id: string): Promise<void> {
  await prisma.service.deleteMany({ where: { id, salonId } });
}

// ── staff ────────────────────────────────────────────────────────────────────
export async function upsertStaff(salonId: string, s: Staff): Promise<Staff> {
  const data = { name: s.name, initials: s.initials, color: s.color, role: s.role, bookableOnline: s.bookableOnline, serviceIds: JSON.stringify(s.serviceIds), weeklyHours: JSON.stringify(s.weeklyHours) };
  const existing = await prisma.staff.findFirst({ where: { id: s.id, salonId } });
  const row = existing ? await prisma.staff.update({ where: { id: s.id }, data }) : await prisma.staff.create({ data: { id: s.id, salonId, ...data } });
  return toStaff(row);
}
export async function removeStaff(salonId: string, id: string): Promise<void> {
  await prisma.staff.updateMany({ where: { id, salonId }, data: { archived: true } });
}

// ── settings ─────────────────────────────────────────────────────────────────
export async function updateSettings(salonId: string, patch: Partial<SalonState["settings"]>): Promise<void> {
  const data: Record<string, unknown> = {};
  for (const k of ["name", "vertical", "currency", "timezone", "onboardingComplete", "calendarConnected"] as const) if (patch[k] !== undefined) data[k] = patch[k];
  if (patch.weeklyHours !== undefined) data.weeklyHours = JSON.stringify(patch.weeklyHours);
  if (Object.keys(data).length) await prisma.salon.update({ where: { id: salonId }, data });
}

// ── memberships ──────────────────────────────────────────────────────────────
export async function upsertPlan(salonId: string, p: MembershipPlan): Promise<MembershipPlan> {
  const data = { name: p.name, priceMinor: p.priceMinor, interval: p.interval, includedServices: JSON.stringify(p.includedServices), discountPct: p.discountPct, loyaltyMultiplier: p.loyaltyMultiplier, active: p.active };
  const existing = await prisma.membershipPlan.findFirst({ where: { id: p.id, salonId } });
  const row = existing ? await prisma.membershipPlan.update({ where: { id: p.id }, data }) : await prisma.membershipPlan.create({ data: { id: p.id, salonId, ...data } });
  return toPlan(row);
}
export async function subscribe(salonId: string, planId: string, clientId: string, id?: string): Promise<MembershipUser> {
  const renews = new Date(); renews.setMonth(renews.getMonth() + 1);
  const row = await prisma.membershipUser.create({ data: { ...(id ? { id } : {}), salonId, planId, clientId, status: "active", renewsAt: renews.toISOString().slice(0, 10) } });
  return toMembership(row);
}
export async function cancelMembership(salonId: string, id: string): Promise<void> {
  await prisma.membershipUser.updateMany({ where: { id, salonId }, data: { status: "cancelled" } });
}

// ── loyalty ──────────────────────────────────────────────────────────────────
export async function addLoyalty(salonId: string, clientId: string, delta: number, reason: LoyaltyTransaction["reason"], note = "", id?: string): Promise<LoyaltyTransaction> {
  const [row] = await prisma.$transaction([
    prisma.loyaltyTransaction.create({ data: { ...(id ? { id } : {}), salonId, clientId, delta, reason, note } }),
    prisma.client.updateMany({ where: { id: clientId, salonId }, data: { loyaltyPoints: { increment: delta } } }),
  ]);
  return toLoyalty(row);
}

// ── campaigns / messages ──────────────────────────────────────────────────────
export async function toggleCampaign(salonId: string, id: string, active: boolean): Promise<void> {
  await prisma.campaign.updateMany({ where: { id, salonId }, data: { active } });
}
export async function sendMessage(salonId: string, clientId: string, channel: Message["channel"], body: string, campaignId?: string | null, id?: string): Promise<Message> {
  const row = await prisma.message.create({ data: { ...(id ? { id } : {}), salonId, clientId, channel, body, campaignId: campaignId ?? null, status: "sent" } });
  return toMessage(row);
}

// ── waitlist ─────────────────────────────────────────────────────────────────
export async function addWaitlist(salonId: string, clientId: string, serviceId: string, windowDay: number, id?: string): Promise<WaitlistEntry> {
  const row = await prisma.waitlistEntry.create({ data: { ...(id ? { id } : {}), salonId, clientId, serviceId, windowDay } });
  return toWaitlist(row);
}
export async function removeWaitlist(salonId: string, id: string): Promise<void> {
  await prisma.waitlistEntry.deleteMany({ where: { id, salonId } });
}

// ── photos ───────────────────────────────────────────────────────────────────
export async function addPhoto(salonId: string, clientId: string, url: string, kind: CustomerPhoto["kind"], id?: string): Promise<CustomerPhoto> {
  const row = await prisma.customerPhoto.create({ data: { ...(id ? { id } : {}), salonId, clientId, url, kind } });
  return toPhoto(row);
}
