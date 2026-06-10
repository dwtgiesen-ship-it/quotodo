// Server-side data access for SalonFlow. Serializes Prisma rows into the DTO shapes
// the front-end uses (src/app/salonflow/lib/types.ts) and implements the mutations
// that, in production, map to the REST endpoints in docs/salonflow/04-api-and-auth.md.

import { prisma } from "@/lib/prisma";
import type {
  Appointment,
  Client,
  SalonState,
  Service,
  Staff,
} from "@/app/salonflow/lib/types";
import { computeSlots, hasConflict, type Slotable } from "./availability";

// ── serializers ───────────────────────────────────────────────────────────────
type ServiceRow = { id: string; name: string; category: string; durationMin: number; priceMinor: number; depositMinor: number | null; bookableOnline: boolean };
type StaffRow = { id: string; name: string; initials: string; color: string; role: string; bookableOnline: boolean; serviceIds: string };
type ClientRow = { id: string; firstName: string; lastName: string; email: string; phone: string; notes: string; since: string; totalSpendMinor: number; loyaltyPoints: number; tier: string; tags: string };
type ApptRow = { id: string; day: number; start: number; end: number; serviceId: string; staffId: string; clientId: string; status: string; source: string; isNew: boolean; starred: boolean };

const toService = (r: ServiceRow): Service => ({ id: r.id, name: r.name, category: r.category as Service["category"], durationMin: r.durationMin, priceMinor: r.priceMinor, depositMinor: r.depositMinor, bookableOnline: r.bookableOnline });
const toStaff = (r: StaffRow): Staff => ({ id: r.id, name: r.name, initials: r.initials, color: r.color, role: r.role as Staff["role"], bookableOnline: r.bookableOnline, serviceIds: JSON.parse(r.serviceIds || "[]") });
const toClient = (r: ClientRow): Client => ({ id: r.id, firstName: r.firstName, lastName: r.lastName, email: r.email, phone: r.phone, notes: r.notes, since: r.since, totalSpendMinor: r.totalSpendMinor, loyaltyPoints: r.loyaltyPoints, tier: r.tier as Client["tier"], tags: JSON.parse(r.tags || "[]") });
const toAppt = (r: ApptRow): Appointment => ({ id: r.id, day: r.day, start: r.start, end: r.end, serviceId: r.serviceId, staffId: r.staffId, clientId: r.clientId, status: r.status as Appointment["status"], source: r.source as Appointment["source"], isNew: r.isNew, starred: r.starred });

// ── reads ──────────────────────────────────────────────────────────────────────
export async function getState(salonId: string): Promise<SalonState> {
  const [salon, services, staff, clients, appts] = await Promise.all([
    prisma.salon.findUnique({ where: { id: salonId } }),
    prisma.service.findMany({ where: { salonId }, orderBy: { sortOrder: "asc" } }),
    prisma.staff.findMany({ where: { salonId } }),
    prisma.client.findMany({ where: { salonId }, orderBy: { firstName: "asc" } }),
    prisma.appointment.findMany({ where: { salonId } }),
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
    },
    services: services.map(toService),
    staff: staff.map(toStaff),
    clients: clients.map(toClient),
    appointments: appts.map(toAppt),
  };
}

async function activeAppointments(salonId: string): Promise<Slotable[]> {
  const rows = await prisma.appointment.findMany({ where: { salonId, NOT: { status: "cancelled" } } });
  return rows.map((r) => ({ day: r.day, start: r.start, end: r.end, staffId: r.staffId, status: r.status }));
}

export async function availability(salonId: string, serviceId: string, staffId: string, day: number): Promise<number[]> {
  const service = await prisma.service.findFirst({ where: { id: serviceId, salonId } });
  if (!service) return [];
  const existing = await activeAppointments(salonId);
  return computeSlots(existing, { day, staffId, durationMin: service.durationMin });
}

// ── writes ───────────────────────────────────────────────────────────────────
export type BookInput = { id?: string; serviceId: string; staffId: string; clientId: string; day: number; start: number; source?: Appointment["source"] };
export type BookResult = { ok: true; appointment: Appointment } | { ok: false; reason: string };

export async function book(salonId: string, input: BookInput): Promise<BookResult> {
  if (input.id) {
    const dupe = await prisma.appointment.findUnique({ where: { id: input.id } });
    if (dupe) return { ok: true, appointment: toAppt(dupe) }; // idempotent replay
  }
  const service = await prisma.service.findFirst({ where: { id: input.serviceId, salonId } });
  if (!service) return { ok: false, reason: "Unknown service" };
  const end = Number((input.start + service.durationMin / 60).toFixed(4));
  const existing = await activeAppointments(salonId);
  if (hasConflict(existing, { day: input.day, start: input.start, end, staffId: input.staffId })) {
    return { ok: false, reason: "That time conflicts with another appointment for this staff member." };
  }
  const row = await prisma.appointment.create({
    data: {
      ...(input.id ? { id: input.id } : {}),
      salonId,
      day: input.day,
      start: input.start,
      end,
      serviceId: input.serviceId,
      staffId: input.staffId,
      clientId: input.clientId,
      status: "booked",
      source: input.source ?? "dashboard",
      isNew: true,
    },
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

export async function addClient(salonId: string, data: Partial<Client> & { firstName: string }): Promise<Client> {
  const row = await prisma.client.create({
    data: {
      ...(data.id ? { id: data.id } : {}),
      salonId,
      firstName: data.firstName,
      lastName: data.lastName ?? "",
      email: data.email ?? "",
      phone: data.phone ?? "",
      notes: data.notes ?? "",
      since: data.since ?? new Date().toISOString().slice(0, 10),
      totalSpendMinor: data.totalSpendMinor ?? 0,
      loyaltyPoints: data.loyaltyPoints ?? 0,
      tier: data.tier ?? "standard",
      tags: JSON.stringify(data.tags ?? ["New"]),
    },
  });
  return toClient(row);
}

export async function upsertService(salonId: string, s: Service): Promise<Service> {
  const data = { name: s.name, category: s.category, durationMin: s.durationMin, priceMinor: s.priceMinor, depositMinor: s.depositMinor, bookableOnline: s.bookableOnline };
  const existing = await prisma.service.findFirst({ where: { id: s.id, salonId } });
  const row = existing
    ? await prisma.service.update({ where: { id: s.id }, data })
    : await prisma.service.create({ data: { id: s.id, salonId, ...data } });
  return toService(row);
}

export async function removeService(salonId: string, id: string): Promise<void> {
  await prisma.service.deleteMany({ where: { id, salonId } });
}

export async function updateSettings(salonId: string, patch: Partial<SalonState["settings"]>): Promise<void> {
  await prisma.salon.update({ where: { id: salonId }, data: patch });
}
