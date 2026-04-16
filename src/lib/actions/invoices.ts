"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { calculateLineTotal, calculateQuoteTotals } from "@/lib/utils";
import type { ActionResult, Invoice, InvoiceLineItem } from "@/types";

// -------- Create invoice from accepted quote --------

export async function createInvoiceFromQuote(
  quoteId: string
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Fetch quote (RLS enforces ownership)
  const { data: quote, error: quoteErr } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", quoteId)
    .single();

  if (quoteErr || !quote) {
    return { success: false, error: "Quote not found" };
  }

  if (quote.status !== "accepted") {
    return {
      success: false,
      error: "Invoice can only be created from an accepted quote",
    };
  }

  // Check for existing invoice
  const { data: existing } = await supabase
    .from("invoices")
    .select("id")
    .eq("quote_id", quoteId)
    .maybeSingle();

  if (existing) {
    // Already exists — return its id instead of creating a duplicate
    return { success: true, data: { id: existing.id } };
  }

  // Fetch line items
  const { data: lineItems, error: itemsErr } = await supabase
    .from("quote_line_items")
    .select("*")
    .eq("quote_id", quoteId)
    .order("sort_order", { ascending: true });

  if (itemsErr) {
    return { success: false, error: itemsErr.message };
  }

  // If client accepted with a specific selection, only invoice those items.
  // Otherwise fall back to default selection (non-optional + default-selected).
  const sourceItems = (lineItems ?? []).filter((li) => {
    if (quote.accepted_selection && Array.isArray(quote.accepted_selection)) {
      return quote.accepted_selection.includes(li.id);
    }
    return !li.optional || li.default_selected;
  });

  // Convert to invoice line items (flat jsonb)
  const invoiceLineItems: InvoiceLineItem[] = sourceItems.map((li) => ({
    description: li.description,
    quantity: li.quantity,
    unit: li.unit,
    unit_price: li.unit_price,
    vat_rate: li.vat_rate,
    line_total: li.line_total,
  }));

  // Recalculate totals for safety
  const totals = calculateQuoteTotals(invoiceLineItems);

  // Generate invoice number
  const { data: invoiceNumber, error: numErr } = await supabase.rpc(
    "generate_invoice_number",
    { p_company_id: quote.company_id }
  );

  if (numErr) {
    return { success: false, error: "Failed to generate invoice number: " + numErr.message };
  }

  // Compute issued_at (today) and due_date
  const now = new Date();
  const issuedAt = now.toISOString().split("T")[0];
  const dueDate = new Date(now);
  dueDate.setDate(dueDate.getDate() + (quote.payment_terms ?? 30));
  const dueDateStr = dueDate.toISOString().split("T")[0];

  // Fetch company default deposit percent
  const { data: company } = await supabase
    .from("companies")
    .select("default_deposit_percent")
    .eq("id", quote.company_id)
    .single();

  const depositPercent = company?.default_deposit_percent ?? 30;
  const depositAmount = Math.round(totals.total * (depositPercent / 100));

  // Insert invoice
  const { data: invoice, error: insertErr } = await supabase
    .from("invoices")
    .insert({
      company_id: quote.company_id,
      quote_id: quote.id,
      invoice_number: invoiceNumber,
      client_name: quote.client_name,
      client_email: quote.client_email,
      title: quote.title,
      notes: quote.notes,
      line_items: invoiceLineItems,
      subtotal: totals.subtotal,
      vat_amount: totals.vatAmount,
      total: totals.total,
      currency: quote.currency,
      payment_terms: quote.payment_terms,
      status: "draft",
      issued_at: issuedAt,
      due_date: dueDateStr,
      deposit_required_percent: depositPercent,
      deposit_amount: depositAmount,
    })
    .select("id")
    .single();

  if (insertErr || !invoice) {
    return {
      success: false,
      error: "Failed to create invoice: " + (insertErr?.message ?? "unknown"),
    };
  }

  revalidatePath("/invoices");
  revalidatePath("/dashboard");
  revalidatePath(`/quotes/${quoteId}`);

  return { success: true, data: { id: invoice.id } };
}

// -------- Get single invoice --------

export async function getInvoiceById(
  id: string
): Promise<ActionResult<Invoice>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return { success: false, error: "Invoice not found" };
  }

  return { success: true, data };
}

// -------- List invoices for current company --------

export async function listInvoices(): Promise<ActionResult<Invoice[]>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: company } = await supabase
    .from("companies")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!company) {
    return { success: false, error: "Company not found" };
  }

  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("company_id", company.id)
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: data ?? [] };
}

// -------- Mark as sent --------

export async function markInvoiceAsSent(
  invoiceId: string
): Promise<ActionResult<void>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: invoice } = await supabase
    .from("invoices")
    .select("status")
    .eq("id", invoiceId)
    .single();

  if (!invoice) {
    return { success: false, error: "Invoice not found" };
  }

  if (invoice.status !== "draft") {
    return { success: false, error: `Invoice is already ${invoice.status}` };
  }

  const { error } = await supabase
    .from("invoices")
    .update({ status: "sent" })
    .eq("id", invoiceId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/invoices");
  revalidatePath("/dashboard");

  return { success: true };
}

// -------- Mark as paid --------

export interface MarkPaidPayload {
  paymentMethod?: "bank_transfer" | "cash" | "other";
  paymentReference?: string;
  notes?: string;
}

export async function markInvoiceAsPaid(
  invoiceId: string,
  payload: MarkPaidPayload = {}
): Promise<ActionResult<void>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: invoice } = await supabase
    .from("invoices")
    .select("status, notes")
    .eq("id", invoiceId)
    .single();

  if (!invoice) {
    return { success: false, error: "Invoice not found" };
  }

  if (invoice.status === "paid") {
    return { success: false, error: "Invoice is already paid" };
  }

  const updates: Record<string, unknown> = {
    status: "paid",
    paid_at: new Date().toISOString(),
  };

  if (payload.paymentMethod) updates.payment_method = payload.paymentMethod;
  if (payload.paymentReference) updates.payment_reference = payload.paymentReference;
  if (payload.notes) {
    // Append notes rather than overwriting quote-derived notes
    const existing = invoice.notes ? invoice.notes + "\n\n" : "";
    updates.notes = existing + payload.notes;
  }

  const { error } = await supabase
    .from("invoices")
    .update(updates)
    .eq("id", invoiceId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/invoices");
  revalidatePath("/dashboard");

  return { success: true };
}

// -------- Mark deposit as paid --------

export async function markDepositAsPaid(
  invoiceId: string
): Promise<ActionResult<void>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: invoice } = await supabase
    .from("invoices")
    .select("deposit_paid")
    .eq("id", invoiceId)
    .single();

  if (!invoice) {
    return { success: false, error: "Invoice not found" };
  }

  if (invoice.deposit_paid) {
    return { success: false, error: "Deposit is already marked as paid" };
  }

  const { error } = await supabase
    .from("invoices")
    .update({
      deposit_paid: true,
      deposit_paid_at: new Date().toISOString(),
    })
    .eq("id", invoiceId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/invoices");
  revalidatePath("/dashboard");

  return { success: true };
}

// -------- Get reminder texts --------

export async function getReminderTextsForInvoice(
  invoiceId: string
): Promise<ActionResult<{ emailSubject: string; emailBody: string; emailFull: string; whatsapp: string }>> {
  const { generateReminderTexts } = await import("@/lib/reminder");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: invoice, error: invErr } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .single();

  if (invErr || !invoice) {
    return { success: false, error: "Invoice not found" };
  }

  const { data: company, error: companyErr } = await supabase
    .from("companies")
    .select("*")
    .eq("id", invoice.company_id)
    .single();

  if (companyErr || !company) {
    return { success: false, error: "Company not found" };
  }

  return { success: true, data: generateReminderTexts(invoice, company) };
}
