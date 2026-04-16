// Database row types — aligned with Supabase schema

export type QuoteStatus = "draft" | "sent" | "accepted" | "rejected";

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
  default_deposit_percent: number;
  created_at: string;
  updated_at: string;
}

export interface Quote {
  id: string;
  company_id: string;
  public_id: string;
  quote_number: string;
  current_version: number;
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
  accepted_at: string | null;
  rejected_at: string | null;
  accepted_selection: string[] | null;
  accepted_total: number | null;
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
  optional: boolean;
  default_selected: boolean;
  created_at: string;
}

// Quote with its line items — used in editor and PDF
export interface QuoteWithLineItems extends Quote {
  line_items: QuoteLineItem[];
}

// --- Quote versions ---

/** Flat snapshot of a quote at a specific version. Stored as jsonb. */
export interface QuoteVersionSnapshot {
  title: string;
  summary: string | null;
  client_name: string;
  client_email: string | null;
  scope_included: string[];
  scope_excluded: string[];
  timeline: string | null;
  subtotal: number;
  vat_amount: number;
  total: number;
  currency: string;
  payment_terms: number;
  notes: string | null;
  line_items: Array<{
    description: string;
    quantity: number;
    unit: string;
    unit_price: number;
    vat_rate: number;
    line_total: number;
  }>;
}

export interface QuoteVersion {
  id: string;
  quote_id: string;
  version_number: number;
  data: QuoteVersionSnapshot;
  created_at: string;
}

// --- Invoices ---

export type InvoiceStatus = "draft" | "sent" | "paid";

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit: string;
  unit_price: number; // cents
  vat_rate: number;
  line_total: number; // cents
}

export interface Invoice {
  id: string;
  company_id: string;
  quote_id: string | null;
  invoice_number: string;
  client_name: string;
  client_email: string | null;
  title: string;
  notes: string | null;
  line_items: InvoiceLineItem[];
  subtotal: number;
  vat_amount: number;
  total: number;
  currency: string;
  payment_terms: number;
  status: InvoiceStatus;
  issued_at: string | null;
  due_date: string | null;
  paid_at: string | null;
  payment_reference: string | null;
  payment_method: "bank_transfer" | "cash" | "other" | null;
  deposit_required_percent: number;
  deposit_amount: number;
  deposit_paid: boolean;
  deposit_paid_at: string | null;
  created_at: string;
  updated_at: string;
}

// Server action response wrapper
export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}
