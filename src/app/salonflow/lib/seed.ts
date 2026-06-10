// Seed data for the SalonFlow demo. Deterministic so the demo always looks good.

import type { SalonState, WeeklyHours } from "./types";

const STD_HOURS: WeeklyHours = {
  mon: [540, 1080],
  tue: [540, 1080],
  wed: [540, 1080],
  thu: [540, 1080],
  fri: [540, 1080],
  sat: [540, 1020],
  sun: null,
};

// tiny inline SVG placeholders so the photo gallery renders with no network
const photo = (a: string, b: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${b}'/></linearGradient></defs><rect width='160' height='160' fill='url(%23g)'/></svg>`,
  )}`;

export const SEED: SalonState = {
  settings: {
    name: "Pearly",
    vertical: "beauty",
    currency: "EUR",
    timezone: "Europe/Amsterdam",
    onboardingComplete: true,
    calendarConnected: true,
    weeklyHours: STD_HOURS,
  },
  services: [
    { id: "svc-express", name: "Express Facial", category: "express", durationMin: 45, priceMinor: 8000, depositMinor: 1500, bookableOnline: true },
    { id: "svc-custom", name: "Custom Facial", category: "custom", durationMin: 60, priceMinor: 9000, depositMinor: 2000, bookableOnline: true },
    { id: "svc-signature", name: "Signature Facial", category: "signature", durationMin: 90, priceMinor: 10000, depositMinor: 2500, bookableOnline: true },
    { id: "svc-hydra", name: "Hydra Facial", category: "hydra", durationMin: 75, priceMinor: 11000, depositMinor: 2500, bookableOnline: true },
    { id: "svc-scrub", name: "Peppermint Body Scrub", category: "scrub", durationMin: 45, priceMinor: 3500, depositMinor: null, bookableOnline: true },
  ],
  staff: [
    { id: "stf-andre", name: "Andre Pearl", initials: "AP", color: "#8B5FB8", role: "owner", bookableOnline: true, serviceIds: ["svc-express", "svc-custom", "svc-signature", "svc-hydra", "svc-scrub"], weeklyHours: STD_HOURS },
    { id: "stf-mia", name: "Mia Chen", initials: "MC", color: "#4F9A57", role: "staff", bookableOnline: true, serviceIds: ["svc-express", "svc-custom", "svc-hydra"], weeklyHours: STD_HOURS },
    { id: "stf-jo", name: "Jo Rivera", initials: "JR", color: "#5777B0", role: "staff", bookableOnline: true, serviceIds: ["svc-signature", "svc-scrub"], weeklyHours: STD_HOURS },
  ],
  clients: [
    { id: "cl-mark", firstName: "Mark", lastName: "Vaughn", email: "mark@example.com", phone: "+31 6 1234 5678", notes: "Prefers fragrance-free products.", since: "2025-08-01", totalSpendMinor: 42000, loyaltyPoints: 420, tier: "silver", tags: ["Friends & Family"], profileType: "generic", profileData: {} },
    { id: "cl-deborah", firstName: "Deborah", lastName: "Salazar", email: "deb@example.com", phone: "+31 6 2345 6789", notes: "", since: "2024-11-12", totalSpendMinor: 88000, loyaltyPoints: 880, tier: "gold", tags: ["VIP"], profileType: "generic", profileData: {} },
    { id: "cl-sheena", firstName: "Sheena", lastName: "Barker", email: "sheena@example.com", phone: "+31 6 3456 7890", notes: "First visit went great.", since: "2026-05-20", totalSpendMinor: 8000, loyaltyPoints: 80, tier: "standard", tags: ["New"], profileType: "generic", profileData: {} },
    { id: "cl-jennifer", firstName: "Jennifer", lastName: "Webb", email: "jen@example.com", phone: "+31 6 4567 8901", notes: "Books monthly.", since: "2025-01-09", totalSpendMinor: 63000, loyaltyPoints: 630, tier: "gold", tags: [], profileType: "nail", profileData: { preferredTechnician: "Mia Chen", nailHistory: ["Gel — almond — nude", "Gel — coffin — French"] } },
    { id: "cl-coltyn", firstName: "Coltyn", lastName: "Myers", email: "coltyn@example.com", phone: "+31 6 5678 9012", notes: "", since: "2025-09-30", totalSpendMinor: 16000, loyaltyPoints: 160, tier: "standard", tags: [], profileType: "generic", profileData: {} },
    { id: "cl-patrick", firstName: "Patrick", lastName: "Thompson", email: "pat@example.com", phone: "+31 6 6789 0123", notes: "Sensitive skin.", since: "2024-07-04", totalSpendMinor: 120000, loyaltyPoints: 1200, tier: "vip", tags: ["VIP"], profileType: "generic", profileData: {} },
    { id: "cl-fernando", firstName: "Fernando", lastName: "Faulkner", email: "fern@example.com", phone: "+31 6 7890 1234", notes: "", since: "2026-02-14", totalSpendMinor: 24000, loyaltyPoints: 240, tier: "standard", tags: [], profileType: "generic", profileData: {} },
    { id: "cl-cameron", firstName: "Cameron", lastName: "Brennan", email: "cam@example.com", phone: "+31 6 8901 2345", notes: "Hasn't booked since spring.", since: "2025-03-01", totalSpendMinor: 31000, loyaltyPoints: 310, tier: "silver", tags: ["Win-back"], profileType: "generic", profileData: {} },
  ],
  appointments: [
    { id: "ap-1", day: 0, start: 13, end: 13.5, serviceId: "svc-scrub", staffId: "stf-jo", clientId: "cl-coltyn", status: "booked", source: "dashboard" },
    { id: "ap-2", day: 0, start: 13.5, end: 14.75, serviceId: "svc-hydra", staffId: "stf-mia", clientId: "cl-deborah", status: "confirmed", source: "online" },
    { id: "ap-3", day: 0, start: 15.25, end: 16, serviceId: "svc-express", staffId: "stf-mia", clientId: "cl-sheena", status: "booked", source: "online", isNew: true },
    { id: "ap-4", day: 0, start: 16, end: 17, serviceId: "svc-custom", staffId: "stf-andre", clientId: "cl-mark", status: "confirmed", source: "dashboard" },
    { id: "ap-5", day: 0, start: 17, end: 18, serviceId: "svc-custom", staffId: "stf-andre", clientId: "cl-jennifer", status: "booked", source: "dashboard" },
    { id: "ap-6", day: 0, start: 18, end: 18.75, serviceId: "svc-express", staffId: "stf-mia", clientId: "cl-coltyn", status: "booked", source: "ai", starred: true },
    { id: "ap-7", day: 0, start: 18.75, end: 20.25, serviceId: "svc-signature", staffId: "stf-jo", clientId: "cl-patrick", status: "confirmed", source: "dashboard" },
    { id: "ap-8", day: 1, start: 12.75, end: 13.5, serviceId: "svc-express", staffId: "stf-mia", clientId: "cl-fernando", status: "booked", source: "online", isNew: true },
    { id: "ap-9", day: 1, start: 13.75, end: 14.75, serviceId: "svc-custom", staffId: "stf-andre", clientId: "cl-cameron", status: "booked", source: "dashboard" },
    { id: "ap-10", day: 1, start: 15, end: 16.25, serviceId: "svc-hydra", staffId: "stf-mia", clientId: "cl-jennifer", status: "confirmed", source: "online", isNew: true },
    { id: "ap-11", day: 1, start: 16.5, end: 17.5, serviceId: "svc-express", staffId: "stf-mia", clientId: "cl-sheena", status: "booked", source: "online", isNew: true },
    { id: "ap-12", day: 1, start: 19.25, end: 20, serviceId: "svc-signature", staffId: "stf-jo", clientId: "cl-deborah", status: "confirmed", source: "dashboard" },
    { id: "ap-13", day: 2, start: 14.5, end: 15.5, serviceId: "svc-custom", staffId: "stf-andre", clientId: "cl-jennifer", status: "booked", source: "dashboard" },
    { id: "ap-14", day: 2, start: 15, end: 16.25, serviceId: "svc-hydra", staffId: "stf-mia", clientId: "cl-fernando", status: "booked", source: "online", isNew: true },
    { id: "ap-15", day: 2, start: 16.75, end: 17.75, serviceId: "svc-custom", staffId: "stf-andre", clientId: "cl-cameron", status: "booked", source: "dashboard" },
    { id: "ap-16", day: 2, start: 18.75, end: 20.25, serviceId: "svc-signature", staffId: "stf-jo", clientId: "cl-patrick", status: "confirmed", source: "dashboard" },
    { id: "ap-17", day: 5, start: 14, end: 15, serviceId: "svc-express", staffId: "stf-mia", clientId: "cl-mark", status: "booked", source: "ai" },
    { id: "ap-18", day: 5, start: 16, end: 17.25, serviceId: "svc-hydra", staffId: "stf-mia", clientId: "cl-deborah", status: "booked", source: "online", isNew: true },
    // a few completed in the recent past for revenue/retention reporting
    { id: "ap-19", day: 0, start: 9, end: 9.75, serviceId: "svc-express", staffId: "stf-mia", clientId: "cl-mark", status: "completed", source: "dashboard" },
    { id: "ap-20", day: 1, start: 9.5, end: 11, serviceId: "svc-signature", staffId: "stf-jo", clientId: "cl-jennifer", status: "completed", source: "dashboard" },
  ],
  membershipPlans: [
    { id: "mp-bronze", name: "Bronze", priceMinor: 2900, interval: "month", includedServices: [{ serviceId: "svc-express", quantity: 1 }], discountPct: 5, loyaltyMultiplier: 1, active: true },
    { id: "mp-silver", name: "Silver", priceMinor: 4900, interval: "month", includedServices: [{ serviceId: "svc-custom", quantity: 1 }], discountPct: 10, loyaltyMultiplier: 1.5, active: true },
    { id: "mp-gold", name: "Gold", priceMinor: 9900, interval: "month", includedServices: [{ serviceId: "svc-signature", quantity: 1 }, { serviceId: "svc-hydra", quantity: 1 }], discountPct: 15, loyaltyMultiplier: 2, active: true },
  ],
  memberships: [
    { id: "mu-1", planId: "mp-gold", clientId: "cl-deborah", status: "active", renewsAt: "2025-09-12" },
    { id: "mu-2", planId: "mp-silver", clientId: "cl-jennifer", status: "active", renewsAt: "2025-09-09" },
  ],
  loyaltyLedger: [
    { id: "lt-1", clientId: "cl-deborah", delta: 200, reason: "earn", note: "Hydra Facial", createdAt: "2025-08-11" },
    { id: "lt-2", clientId: "cl-deborah", delta: 50, reason: "birthday", note: "Birthday bonus", createdAt: "2025-08-01" },
    { id: "lt-3", clientId: "cl-jennifer", delta: 150, reason: "earn", note: "Signature Facial", createdAt: "2025-08-12" },
    { id: "lt-4", clientId: "cl-mark", delta: -100, reason: "redeem", note: "€10 off", createdAt: "2025-08-10" },
  ],
  campaigns: [
    { id: "cmp-confirm", type: "confirmation", channel: "sms", template: "Hi {first_name}, your {service} with {staff} on {date} is confirmed. Reply STOP to opt out.", triggerOffsetMin: 0, active: true },
    { id: "cmp-remind", type: "reminder", channel: "sms", template: "Reminder: {service} tomorrow at {time}. See you at {salon}!", triggerOffsetMin: -1440, active: true },
    { id: "cmp-review", type: "review", channel: "email", template: "Thanks for visiting, {first_name}! How did we do? Leave a review ⭐", triggerOffsetMin: 120, active: true },
    { id: "cmp-rebook", type: "rebooking", channel: "sms", template: "Time for your next {service}, {first_name}? Book in 2 taps: {link}", triggerOffsetMin: 40320, active: true },
    { id: "cmp-bday", type: "birthday", channel: "email", template: "Happy birthday {first_name}! Here's 15% off your next visit 🎁", triggerOffsetMin: null, active: true },
    { id: "cmp-winback", type: "win_back", channel: "sms", template: "We miss you {first_name}! Come back for 20% off this month.", triggerOffsetMin: null, active: false },
  ],
  messages: [
    { id: "msg-1", campaignId: "cmp-confirm", clientId: "cl-mark", channel: "sms", status: "delivered", body: "Hi Mark, your Custom Facial with Andre on Wed 13 Aug is confirmed.", createdAt: "2025-08-12" },
    { id: "msg-2", campaignId: "cmp-remind", clientId: "cl-deborah", channel: "sms", status: "read", body: "Reminder: Hydra Facial tomorrow at 1:30 PM. See you at Pearly!", createdAt: "2025-08-12" },
    { id: "msg-3", campaignId: "cmp-review", clientId: "cl-jennifer", channel: "email", status: "sent", body: "Thanks for visiting, Jennifer! How did we do?", createdAt: "2025-08-11" },
  ],
  waitlist: [
    { id: "wl-1", clientId: "cl-cameron", serviceId: "svc-custom", windowDay: 3, filledAt: null },
  ],
  photos: [
    { id: "ph-1", clientId: "cl-jennifer", url: photo("#E8DCF4", "#8B5FB8"), kind: "before" },
    { id: "ph-2", clientId: "cl-jennifer", url: photo("#FBD9DE", "#D06277"), kind: "after" },
    { id: "ph-3", clientId: "cl-deborah", url: photo("#D9E5F6", "#5777B0"), kind: "reference" },
  ],
};
