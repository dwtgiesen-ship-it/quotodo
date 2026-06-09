// Seed data for the SalonFlow demo. Deterministic so the demo always looks good.

import type { SalonState } from "./types";

export const SEED: SalonState = {
  settings: {
    name: "Pearly",
    vertical: "beauty",
    currency: "EUR",
    timezone: "Europe/Amsterdam",
    onboardingComplete: true,
    calendarConnected: true,
  },
  services: [
    { id: "svc-express", name: "Express Facial", category: "express", durationMin: 45, priceMinor: 8000, depositMinor: 1500, bookableOnline: true },
    { id: "svc-custom", name: "Custom Facial", category: "custom", durationMin: 60, priceMinor: 9000, depositMinor: 2000, bookableOnline: true },
    { id: "svc-signature", name: "Signature Facial", category: "signature", durationMin: 90, priceMinor: 10000, depositMinor: 2500, bookableOnline: true },
    { id: "svc-hydra", name: "Hydra Facial", category: "hydra", durationMin: 75, priceMinor: 11000, depositMinor: 2500, bookableOnline: true },
    { id: "svc-scrub", name: "Peppermint Body Scrub", category: "scrub", durationMin: 45, priceMinor: 3500, depositMinor: null, bookableOnline: true },
  ],
  staff: [
    { id: "stf-andre", name: "Andre Pearl", initials: "AP", color: "#8B5FB8", role: "owner", bookableOnline: true, serviceIds: ["svc-express", "svc-custom", "svc-signature", "svc-hydra", "svc-scrub"] },
    { id: "stf-mia", name: "Mia Chen", initials: "MC", color: "#4F9A57", role: "staff", bookableOnline: true, serviceIds: ["svc-express", "svc-custom", "svc-hydra"] },
    { id: "stf-jo", name: "Jo Rivera", initials: "JR", color: "#5777B0", role: "staff", bookableOnline: true, serviceIds: ["svc-signature", "svc-scrub"] },
  ],
  clients: [
    { id: "cl-mark", firstName: "Mark", lastName: "Vaughn", email: "mark@example.com", phone: "+31 6 1234 5678", notes: "Prefers fragrance-free products.", since: "2025-08-01", totalSpendMinor: 42000, loyaltyPoints: 420, tier: "silver", tags: ["Friends & Family"] },
    { id: "cl-deborah", firstName: "Deborah", lastName: "Salazar", email: "deb@example.com", phone: "+31 6 2345 6789", notes: "", since: "2024-11-12", totalSpendMinor: 88000, loyaltyPoints: 880, tier: "gold", tags: ["VIP"] },
    { id: "cl-sheena", firstName: "Sheena", lastName: "Barker", email: "sheena@example.com", phone: "+31 6 3456 7890", notes: "First visit went great.", since: "2026-05-20", totalSpendMinor: 8000, loyaltyPoints: 80, tier: "standard", tags: ["New"] },
    { id: "cl-jennifer", firstName: "Jennifer", lastName: "Webb", email: "jen@example.com", phone: "+31 6 4567 8901", notes: "Books monthly.", since: "2025-01-09", totalSpendMinor: 63000, loyaltyPoints: 630, tier: "gold", tags: [] },
    { id: "cl-coltyn", firstName: "Coltyn", lastName: "Myers", email: "coltyn@example.com", phone: "+31 6 5678 9012", notes: "", since: "2025-09-30", totalSpendMinor: 16000, loyaltyPoints: 160, tier: "standard", tags: [] },
    { id: "cl-patrick", firstName: "Patrick", lastName: "Thompson", email: "pat@example.com", phone: "+31 6 6789 0123", notes: "Sensitive skin.", since: "2024-07-04", totalSpendMinor: 120000, loyaltyPoints: 1200, tier: "vip", tags: ["VIP"] },
    { id: "cl-fernando", firstName: "Fernando", lastName: "Faulkner", email: "fern@example.com", phone: "+31 6 7890 1234", notes: "", since: "2026-02-14", totalSpendMinor: 24000, loyaltyPoints: 240, tier: "standard", tags: [] },
    { id: "cl-cameron", firstName: "Cameron", lastName: "Brennan", email: "cam@example.com", phone: "+31 6 8901 2345", notes: "Hasn't booked since spring.", since: "2025-03-01", totalSpendMinor: 31000, loyaltyPoints: 310, tier: "silver", tags: ["Win-back"] },
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
  ],
};
