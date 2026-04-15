// Database row types — aligned with Supabase schema

export type QuoteStatus = "draft" | "final";

export interface Company {
  id: string;
  user_id: string;
  company_name: string;
  address: string;
  postal_code: string | null;
  city: string | null;
  country: string;
  vat_number: string;
  iban: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  brand_color_primary: string | null;
  brand_color_secondary: string | null;
  default_payment_terms: number;
  default_quote_validity: number;
  default_currency: string;
  created_at: string;
  updated_at: string;
}

export interface Quote {
  id: string;
  company_id: string;
  quote_number: string;
  client_name: string;
  client_email: string | null;
  title: string;
  summary: string | null;
  scope_included: string[];
  scope_excluded: string[];
  timeline: string | null;
  status: QuoteStatus;
  subtotal: number; // cents
  vat_amount: number; // cents
  total: number; // cents
  currency: string;
  valid_until: string | null;
  payment_terms: number;
  notes: string | null;
  original_input: string;
  ai_raw_response: Record<string, unknown> | null;
  ai_edited: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuoteLineItem {
  id: string;
  quote_id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number; // cents
  vat_rate: number;
  line_total: number; // cents, excl. VAT
  sort_order: number;
  created_at: string;
}

// Quote with its line items — used in editor and PDF
export interface QuoteWithLineItems extends Quote {
  line_items: QuoteLineItem[];
}

// Server action response wrapper
export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}
