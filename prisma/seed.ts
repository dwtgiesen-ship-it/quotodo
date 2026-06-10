// Seeds the local SQLite database from the demo seed data.
// Idempotent: wipes the demo salon and re-inserts. Run with: npm run db:seed

import { PrismaClient } from "@prisma/client";
import { SEED } from "../src/app/salonflow/lib/seed";
import { DEMO_SALON_ID } from "../src/lib/salonflow/constants";

const prisma = new PrismaClient();

async function main() {
  // wipe (children first)
  await prisma.message.deleteMany({ where: { salonId: DEMO_SALON_ID } });
  await prisma.campaign.deleteMany({ where: { salonId: DEMO_SALON_ID } });
  await prisma.loyaltyTransaction.deleteMany({ where: { salonId: DEMO_SALON_ID } });
  await prisma.membershipUser.deleteMany({ where: { salonId: DEMO_SALON_ID } });
  await prisma.membershipPlan.deleteMany({ where: { salonId: DEMO_SALON_ID } });
  await prisma.waitlistEntry.deleteMany({ where: { salonId: DEMO_SALON_ID } });
  await prisma.customerPhoto.deleteMany({ where: { salonId: DEMO_SALON_ID } });
  await prisma.appointment.deleteMany({ where: { salonId: DEMO_SALON_ID } });
  await prisma.client.deleteMany({ where: { salonId: DEMO_SALON_ID } });
  await prisma.staff.deleteMany({ where: { salonId: DEMO_SALON_ID } });
  await prisma.service.deleteMany({ where: { salonId: DEMO_SALON_ID } });
  await prisma.salon.deleteMany({ where: { id: DEMO_SALON_ID } });

  await prisma.salon.create({
    data: {
      id: DEMO_SALON_ID,
      name: SEED.settings.name,
      slug: "pearly",
      vertical: SEED.settings.vertical,
      currency: SEED.settings.currency,
      timezone: SEED.settings.timezone,
      onboardingComplete: SEED.settings.onboardingComplete,
      calendarConnected: SEED.settings.calendarConnected,
      weeklyHours: JSON.stringify(SEED.settings.weeklyHours),
    },
  });

  for (const [i, s] of SEED.services.entries()) {
    await prisma.service.create({ data: { id: s.id, salonId: DEMO_SALON_ID, name: s.name, category: s.category, durationMin: s.durationMin, priceMinor: s.priceMinor, depositMinor: s.depositMinor, bookableOnline: s.bookableOnline, sortOrder: i } });
  }
  for (const m of SEED.staff) {
    await prisma.staff.create({ data: { id: m.id, salonId: DEMO_SALON_ID, name: m.name, initials: m.initials, color: m.color, role: m.role, bookableOnline: m.bookableOnline, serviceIds: JSON.stringify(m.serviceIds), weeklyHours: JSON.stringify(m.weeklyHours) } });
  }
  for (const c of SEED.clients) {
    await prisma.client.create({ data: { id: c.id, salonId: DEMO_SALON_ID, firstName: c.firstName, lastName: c.lastName, email: c.email, phone: c.phone, notes: c.notes, since: c.since, totalSpendMinor: c.totalSpendMinor, loyaltyPoints: c.loyaltyPoints, tier: c.tier, tags: JSON.stringify(c.tags), profileType: c.profileType, profileData: JSON.stringify(c.profileData) } });
  }
  for (const a of SEED.appointments) {
    await prisma.appointment.create({ data: { id: a.id, salonId: DEMO_SALON_ID, day: a.day, start: a.start, end: a.end, serviceId: a.serviceId, staffId: a.staffId, clientId: a.clientId, status: a.status, source: a.source, isNew: a.isNew ?? false, starred: a.starred ?? false } });
  }
  for (const [i, p] of SEED.membershipPlans.entries()) {
    await prisma.membershipPlan.create({ data: { id: p.id, salonId: DEMO_SALON_ID, name: p.name, priceMinor: p.priceMinor, interval: p.interval, includedServices: JSON.stringify(p.includedServices), discountPct: p.discountPct, loyaltyMultiplier: p.loyaltyMultiplier, active: p.active, sortOrder: i } });
  }
  for (const m of SEED.memberships) {
    await prisma.membershipUser.create({ data: { id: m.id, salonId: DEMO_SALON_ID, planId: m.planId, clientId: m.clientId, status: m.status, renewsAt: m.renewsAt } });
  }
  for (const t of SEED.loyaltyLedger) {
    await prisma.loyaltyTransaction.create({ data: { id: t.id, salonId: DEMO_SALON_ID, clientId: t.clientId, delta: t.delta, reason: t.reason, note: t.note } });
  }
  for (const c of SEED.campaigns) {
    await prisma.campaign.create({ data: { id: c.id, salonId: DEMO_SALON_ID, type: c.type, channel: c.channel, template: c.template, triggerOffsetMin: c.triggerOffsetMin, active: c.active } });
  }
  for (const m of SEED.messages) {
    await prisma.message.create({ data: { id: m.id, salonId: DEMO_SALON_ID, campaignId: m.campaignId, clientId: m.clientId, channel: m.channel, status: m.status, body: m.body } });
  }
  for (const w of SEED.waitlist) {
    await prisma.waitlistEntry.create({ data: { id: w.id, salonId: DEMO_SALON_ID, clientId: w.clientId, serviceId: w.serviceId, windowDay: w.windowDay } });
  }
  for (const p of SEED.photos) {
    await prisma.customerPhoto.create({ data: { id: p.id, salonId: DEMO_SALON_ID, clientId: p.clientId, url: p.url, kind: p.kind } });
  }

  console.log("Seeded demo salon:", {
    services: SEED.services.length, staff: SEED.staff.length, clients: SEED.clients.length,
    appointments: SEED.appointments.length, plans: SEED.membershipPlans.length, memberships: SEED.memberships.length,
    campaigns: SEED.campaigns.length, messages: SEED.messages.length, waitlist: SEED.waitlist.length, photos: SEED.photos.length,
  });
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
