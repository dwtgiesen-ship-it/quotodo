// Schedulemode MVP — shared domain types for the in-browser demo store.
// Mirrors the production data model in docs/salonflow/prisma/schema.prisma,
// trimmed to what the working demo needs.

export type Category =
  | "express"
  | "custom"
  | "hydra"
  | "signature"
  | "scrub"
  | "break";

export type Service = {
  id: string;
  name: string;
  category: Category;
  durationMin: number;
  priceMinor: number; // minor units (cents)
  depositMinor: number | null;
  bookableOnline: boolean;
};

export type Staff = {
  id: string;
  name: string;
  initials: string;
  color: string;
  role: "owner" | "manager" | "staff" | "receptionist";
  bookableOnline: boolean;
  serviceIds: string[];
  weeklyHours: WeeklyHours;
};

export type ProfileType = "pet" | "nail" | "generic";

export type Client = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  notes: string;
  since: string; // ISO date
  totalSpendMinor: number;
  loyaltyPoints: number;
  tier: "standard" | "silver" | "gold" | "vip";
  tags: string[];
  profileType: ProfileType;
  profileData: Record<string, unknown>;
};

export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
export type WeeklyHours = Partial<Record<Weekday, [number, number] | null>>; // [startMin, endMin]

export type MembershipPlan = {
  id: string;
  name: string;
  priceMinor: number;
  interval: "month" | "year";
  includedServices: { serviceId: string; quantity: number }[];
  discountPct: number;
  loyaltyMultiplier: number;
  active: boolean;
};

export type MembershipUser = {
  id: string;
  planId: string;
  clientId: string;
  status: "active" | "past_due" | "cancelled";
  renewsAt: string | null;
};

export type LoyaltyTransaction = {
  id: string;
  clientId: string;
  delta: number;
  reason: "earn" | "redeem" | "referral" | "birthday" | "adjustment";
  note: string;
  createdAt: string;
};

export type Channel = "sms" | "email" | "whatsapp";

export type CampaignType = "confirmation" | "reminder" | "review" | "rebooking" | "birthday" | "win_back";

export type Campaign = {
  id: string;
  type: CampaignType;
  channel: "sms" | "email" | "whatsapp";
  template: string;
  triggerOffsetMin: number | null;
  active: boolean;
};

export type Message = {
  id: string;
  campaignId: string | null;
  clientId: string;
  channel: "sms" | "email" | "whatsapp";
  status: "queued" | "sent" | "delivered" | "read" | "failed";
  body: string;
  createdAt: string;
};

export type WaitlistEntry = {
  id: string;
  clientId: string;
  serviceId: string;
  windowDay: number; // -1 = any
  filledAt: string | null;
};

export type CustomerPhoto = {
  id: string;
  clientId: string;
  url: string;
  kind: "before" | "after" | "reference";
};

export type AppointmentStatus =
  | "booked"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export type AppointmentSource = "dashboard" | "online" | "ai";

export type Appointment = {
  id: string;
  day: number; // 0..6 within the visible week (Wed-anchored, matching the demo)
  start: number; // decimal hour, 24h
  end: number;
  serviceId: string;
  staffId: string;
  clientId: string;
  status: AppointmentStatus;
  source: AppointmentSource;
  isNew?: boolean;
  starred?: boolean;
};

export type SalonSettings = {
  name: string;
  vertical: "hair" | "barber" | "nails" | "lash" | "brow" | "beauty" | "spa" | "pet";
  currency: string;
  timezone: string;
  onboardingComplete: boolean;
  calendarConnected: boolean;
  weeklyHours: WeeklyHours;
};

export type SalonState = {
  settings: SalonSettings;
  services: Service[];
  staff: Staff[];
  clients: Client[];
  appointments: Appointment[];
  membershipPlans: MembershipPlan[];
  memberships: MembershipUser[];
  loyaltyLedger: LoyaltyTransaction[];
  campaigns: Campaign[];
  messages: Message[];
  waitlist: WaitlistEntry[];
  photos: CustomerPhoto[];
};

export const CATEGORY_STYLES: Record<
  Category,
  { fill: string; accent: string; text: string; label: string }
> = {
  express: { fill: "#DCEFD8", accent: "#4F9A57", text: "#234A28", label: "Express Facial" },
  custom: { fill: "#E8DCF4", accent: "#8B5FB8", text: "#432A5C", label: "Custom Facial" },
  hydra: { fill: "#FBD9DE", accent: "#D06277", text: "#5E2630", label: "Hydra Facial" },
  signature: { fill: "#D9E5F6", accent: "#5777B0", text: "#26334F", label: "Signature Facial" },
  scrub: { fill: "#CFE9E5", accent: "#3F968C", text: "#1F4A45", label: "Body Scrub" },
  break: { fill: "#ECECEC", accent: "#B0B0B0", text: "#6B6B6B", label: "Break" },
};

export const DAYS = [
  { label: "Wed", date: 13 },
  { label: "Thu", date: 14 },
  { label: "Fri", date: 15 },
  { label: "Sat", date: 16 },
  { label: "Sun", date: 17 },
  { label: "Mon", date: 18 },
  { label: "Tue", date: 19 },
];

export const DAY_START = 9;
export const DAY_END = 20.5;
export const HOUR_HEIGHT = 56;

export function money(minor: number, currency = "EUR"): string {
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  return `${symbol}${(minor / 100).toFixed(minor % 100 === 0 ? 0 : 2)}`;
}

export function fmtRange(start: number, end: number): string {
  const fmt = (h: number) => {
    const hour = Math.floor(h);
    const min = Math.round((h - hour) * 60);
    const display = hour % 12 === 0 ? 12 : hour % 12;
    return `${display}:${min === 0 ? "00" : String(min).padStart(2, "0")}`;
  };
  const period = end >= 12 ? "PM" : "AM";
  return `${fmt(start)} - ${fmt(end)} ${period}`;
}
