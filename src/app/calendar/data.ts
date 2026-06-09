// Mock data for the salon scheduling + checkout screen.
// Grounded in the GlossGenius calendar/checkout reference (Refero).

export type Category =
  | "express" // Express Facial – green
  | "custom" // Custom Facial – purple
  | "hydra" // Hydra Facial – rose
  | "signature" // Signature Facial – blue
  | "scrub" // Body scrub / misc – teal
  | "break"; // Break / blocked – hatched gray

export type Appointment = {
  id: string;
  day: number; // 0 = Wed ... 6 = Tue
  start: number; // decimal hour, 24h (e.g. 13.5 = 1:30 PM)
  end: number;
  service: string;
  client: string;
  category: Category;
  isNew?: boolean;
  starred?: boolean;
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

// Visible time window: 1 PM – 8 PM
export const DAY_START = 13;
export const DAY_END = 20.5;
export const HOUR_HEIGHT = 60; // px per hour

export const SELECTED_APPT_ID = "wed-mark";

export const APPOINTMENTS: Appointment[] = [
  // Wed 13
  { id: "wed-break", day: 0, start: 13, end: 13.5, service: "Break", client: "", category: "break" },
  { id: "wed-deb", day: 0, start: 13.5, end: 14.75, service: "Hydra Facial", client: "Deborah Salazar", category: "hydra" },
  { id: "wed-sheena", day: 0, start: 15.25, end: 16, service: "Express Facial", client: "Sheena Barker", category: "express", isNew: true },
  { id: SELECTED_APPT_ID, day: 0, start: 16, end: 17, service: "Custom Facial", client: "Mark Vaughn", category: "custom" },
  { id: "wed-webb", day: 0, start: 17, end: 18, service: "Custom Facial", client: "Jennifer Webb", category: "custom" },
  { id: "wed-coltyn", day: 0, start: 18, end: 18.75, service: "Express Facial", client: "Coltyn Myers", category: "express", starred: true },
  { id: "wed-patrick", day: 0, start: 18.75, end: 20.25, service: "Signature Facial", client: "Patrick Thompson", category: "signature" },

  // Thu 14
  { id: "thu-fernando", day: 1, start: 12.75, end: 13.5, service: "Express Facial", client: "Fernando Faulkner", category: "express", isNew: true },
  { id: "thu-cameron", day: 1, start: 13.75, end: 14.75, service: "Custom Facial", client: "Cameron Brennan", category: "custom" },
  { id: "thu-fitz", day: 1, start: 15, end: 16.25, service: "Hydra Facial", client: "Mark Fitzgerald", category: "hydra", isNew: true },
  { id: "thu-jose", day: 1, start: 16.5, end: 17.5, service: "Express Facial", client: "Jose Hamilton", category: "express", isNew: true },
  { id: "thu-webb", day: 1, start: 17.75, end: 18.25, service: "Custom Facial", client: "Jennifer Webb", category: "custom" },
  { id: "thu-evelyn", day: 1, start: 19.25, end: 20, service: "Signature Facial", client: "Evelyn Martinez", category: "signature", isNew: true },

  // Fri 15
  { id: "fri-block", day: 2, start: 13, end: 13.5, service: "Held", client: "", category: "scrub", starred: true },
  { id: "fri-bobby", day: 2, start: 14.5, end: 15.5, service: "Custom Facial", client: "Bobby Fletcher", category: "signature" },
  { id: "fri-fitz", day: 2, start: 15, end: 16.5, service: "Hydra Facial", client: "Mark Fitzgerald", category: "hydra", isNew: true },
  { id: "fri-julie", day: 2, start: 16.75, end: 17.75, service: "Custom Facial", client: "Julie Harrison", category: "custom" },
  { id: "fri-hernandez", day: 2, start: 17.75, end: 18.75, service: "Signature Facial", client: "Jennifer Hernandez", category: "signature", starred: true },
  { id: "fri-amanda", day: 2, start: 18.75, end: 20.25, service: "Signature Facial", client: "Amanda Brown", category: "signature" },

  // Mon 18
  { id: "mon-grace", day: 5, start: 14, end: 15, service: "Express Facial", client: "Grace Liu", category: "express" },
  { id: "mon-omar", day: 5, start: 16, end: 17.25, service: "Hydra Facial", client: "Omar Haddad", category: "hydra", isNew: true },
];

export type ServiceMenuItem = { name: string; price: number };

export const SERVICE_MENU: { section: string; items: ServiceMenuItem[] }[] = [
  {
    section: "Facials",
    items: [
      { name: "Express Facial", price: 80 },
      { name: "Custom Facial", price: 90 },
      { name: "Signature Facial", price: 100 },
      { name: "Hydra Facial", price: 110 },
    ],
  },
];

export type CartItem = {
  service: string;
  price: number;
  provider: string;
  collapsible?: boolean;
};

export const CHECKOUT = {
  client: { name: "Mark Vaughn", initials: "MV", since: "Client since August 2025" },
  discount: "Gets Friends & Family discount",
  highlightedService: "Signature Facial",
  cart: [
    { service: "Custom Facial", price: 90, provider: "with Andre", collapsible: true },
    { service: "Peppermint Body Scrub", price: 35, provider: "sold by Andre", collapsible: true },
  ] as CartItem[],
};
