import { z } from "zod";

// --- Paste input validation ---

export const PasteInputSchema = z.object({
  text: z
    .string()
    .min(10, "Input must be at least 10 characters")
    .max(10000, "Input must be at most 10,000 characters"),
});

export type PasteInput = z.infer<typeof PasteInputSchema>;

// --- AI response schema (contract between Claude and the app) ---

export const AILineItemSchema = z.object({
  description: z.string().default(""),
  quantity: z.number().default(1),
  unit: z.string().default("per stuk"),
  unit_price_cents: z.number().nullable().default(null), // null = user must fill in
  vat_rate: z.number().default(21),
});

export type AILineItem = z.infer<typeof AILineItemSchema>;

export const QuoteAIResponseSchema = z.object({
  project_title: z.string().default("Untitled Quote"),
  client_name: z.string().default(""),
  client_email: z.string().default(""),
  summary: z.string().default(""),
  scope_included: z.array(z.string()).default([]),
  scope_excluded: z.array(z.string()).default([]),
  timeline: z.string().default(""),
  line_items: z.array(AILineItemSchema).default([]),
  payment_terms_days: z.number().default(30),
  notes: z.string().default(""),
});

export type QuoteAIResponse = z.infer<typeof QuoteAIResponseSchema>;

// Fallback skeleton when AI fails completely
export const QUOTE_AI_FALLBACK: QuoteAIResponse = {
  project_title: "Untitled Quote",
  client_name: "",
  client_email: "",
  summary: "",
  scope_included: [],
  scope_excluded: [],
  timeline: "",
  line_items: [],
  payment_terms_days: 30,
  notes: "",
};

// --- Company onboarding form validation ---

export const CompanyOnboardingSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  address: z.string().min(1, "Address is required"),
  postal_code: z.string().default(""),
  city: z.string().default(""),
  vat_number: z.string().min(1, "BTW-nummer is required"),
  iban: z.string().min(1, "IBAN is required"),
});

export type CompanyOnboarding = z.infer<typeof CompanyOnboardingSchema>;

// --- Quote form validation (editor save) ---

export const QuoteLineItemFormSchema = z.object({
  id: z.string().optional(), // undefined for new items
  description: z.string().min(1, "Description is required"),
  quantity: z.number().positive("Quantity must be positive"),
  unit: z.string().default("per stuk"),
  unit_price: z.number().int().min(0, "Price cannot be negative"), // cents
  vat_rate: z.number().default(21),
  sort_order: z.number().int().default(0),
});

export type QuoteLineItemForm = z.infer<typeof QuoteLineItemFormSchema>;

export const QuoteFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  client_name: z.string().default(""),
  client_email: z.string().email("Invalid email").or(z.literal("")).default(""),
  summary: z.string().default(""),
  scope_included: z.array(z.string()).default([]),
  scope_excluded: z.array(z.string()).default([]),
  timeline: z.string().default(""),
  payment_terms: z.number().int().positive().default(30),
  valid_until: z.string().default(""), // ISO date string
  notes: z.string().default(""),
  line_items: z.array(QuoteLineItemFormSchema).default([]),
});

export type QuoteForm = z.infer<typeof QuoteFormSchema>;
