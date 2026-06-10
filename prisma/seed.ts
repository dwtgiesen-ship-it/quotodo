// Seeds the local SQLite database from the demo seed data.
// Idempotent: wipes the demo salon and re-inserts. Run with: npm run db:seed

import { PrismaClient } from "@prisma/client";
import { SEED } from "../src/app/salonflow/lib/seed";

const prisma = new PrismaClient();
export const DEMO_SALON_ID = "salon-demo";

async function main() {
  // wipe (children first)
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
    },
  });

  for (const [i, s] of SEED.services.entries()) {
    await prisma.service.create({
      data: {
        id: s.id,
        salonId: DEMO_SALON_ID,
        name: s.name,
        category: s.category,
        durationMin: s.durationMin,
        priceMinor: s.priceMinor,
        depositMinor: s.depositMinor,
        bookableOnline: s.bookableOnline,
        sortOrder: i,
      },
    });
  }

  for (const m of SEED.staff) {
    await prisma.staff.create({
      data: {
        id: m.id,
        salonId: DEMO_SALON_ID,
        name: m.name,
        initials: m.initials,
        color: m.color,
        role: m.role,
        bookableOnline: m.bookableOnline,
        serviceIds: JSON.stringify(m.serviceIds),
      },
    });
  }

  for (const c of SEED.clients) {
    await prisma.client.create({
      data: {
        id: c.id,
        salonId: DEMO_SALON_ID,
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: c.phone,
        notes: c.notes,
        since: c.since,
        totalSpendMinor: c.totalSpendMinor,
        loyaltyPoints: c.loyaltyPoints,
        tier: c.tier,
        tags: JSON.stringify(c.tags),
      },
    });
  }

  for (const a of SEED.appointments) {
    await prisma.appointment.create({
      data: {
        id: a.id,
        salonId: DEMO_SALON_ID,
        day: a.day,
        start: a.start,
        end: a.end,
        serviceId: a.serviceId,
        staffId: a.staffId,
        clientId: a.clientId,
        status: a.status,
        source: a.source,
        isNew: a.isNew ?? false,
        starred: a.starred ?? false,
      },
    });
  }

  const counts = {
    services: SEED.services.length,
    staff: SEED.staff.length,
    clients: SEED.clients.length,
    appointments: SEED.appointments.length,
  };
  console.log("Seeded demo salon:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
