"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { PasteInputSchema, type QuoteAIResponse } from "@/lib/validations";
import { generateQuote } from "@/lib/ai";
import { sendQuoteEmail } from "@/lib/email";
import {
  snapshotQuoteAsVersion,
  createNewQuoteVersion,
} from "@/lib/actions/quote-versions";
import { calculateLineTotal, calculateQuoteTotals } from "@/lib/utils";
import type { ActionResult, Quote, QuoteLineItem } from "@/types";

// -------- Generate + Save --------

export async function generateAndSaveQuote(
  input: string
): Promise<ActionResult<{ id: string }>> {
  const parsed = PasteInputSchema.safeParse({ text: input });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get user's company
  const { data: company, error: companyErr } = await supabase
    .from("companies")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (companyErr || !company) {
    return { success: false, error: "Company not found" };
  }

  // Generate via AI
  const { data: aiData, raw } = await generateQuote(parsed.data.text);

  // Generate quote number
  const { data: quoteNumber, error: numErr } = await supabase.rpc(
    "generate_quote_number",
    { p_company_id: company.id }
  );

  if (numErr) {
    return { success: false, error: "Failed to generate quote number: " + numErr.message };
  }

  // Totals reflect default selection: non-optional + optional-selected items
  const lineItemsForCalc = aiData.line_items
    .filter((li) => !li.optional || li.default_selected)
    .map((li) => ({
      quantity: li.quantity,
      unit_price: li.unit_price_cents ?? 0,
      vat_rate: li.vat_rate,
    }));
  const totals = calculateQuoteTotals(lineItemsForCalc);

  // Insert quote
  const { data: quote, error: quoteErr } = await supabase
    .from("quotes")
    .insert({
      company_id: company.id,
      quote_number: quoteNumber,
      client_name: aiData.client_name,
      client_email: aiData.client_email,
      title: aiData.project_title,
      summary: aiData.summary,
      scope_included: aiData.scope_included,
      scope_excluded: aiData.scope_excluded,
      timeline: aiData.timeline,
      status: "draft",
      subtotal: totals.subtotal,
      vat_amount: totals.vatAmount,
      total: totals.total,
      currency: "EUR",
      payment_terms: aiData.payment_terms_days,
      notes: aiData.notes,
      original_input: parsed.data.text,
      ai_raw_response: { text: raw },
      ai_edited: false,
    })
    .select("id")
    .single();

  if (quoteErr || !quote) {
    return { success: false, error: "Failed to save quote: " + (quoteErr?.message ?? "unknown") };
  }

  // Insert line items
  if (aiData.line_items.length > 0) {
    const lineItemRows = aiData.line_items.map((li, i) => ({
      quote_id: quote.id,
      description: li.description,
      quantity: li.quantity,
      unit: li.unit,
      unit_price: li.unit_price_cents ?? 0,
      vat_rate: li.vat_rate,
      line_total: calculateLineTotal(li.quantity, li.unit_price_cents ?? 0),
      sort_order: i,
      optional: li.optional,
      default_selected: li.default_selected,
    }));

    const { error: itemsErr } = await supabase
      .from("quote_line_items")
      .insert(lineItemRows);

    if (itemsErr) {
      return { success: false, error: "Failed to save line items: " + itemsErr.message };
    }
  }

  // Snapshot as version 1
  await snapshotQuoteAsVersion(quote.id, 1);

  return { success: true, data: { id: quote.id } };
}

// -------- Get single quote --------

export async function getQuoteById(
  id: string
): Promise<ActionResult<{ quote: Quote; lineItems: QuoteLineItem[] }>> {
  const supabase = await createClient();

  const { data: quote, error: quoteErr } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", id)
    .single();

  if (quoteErr || !quote) {
    return { success: false, error: "Quote not found" };
  }

  const { data: lineItems, error: itemsErr } = await supabase
    .from("quote_line_items")
    .select("*")
    .eq("quote_id", id)
    .order("sort_order", { ascending: true });

  if (itemsErr) {
    return { success: false, error: itemsErr.message };
  }

  return { success: true, data: { quote, lineItems: lineItems ?? [] } };
}

// -------- List quotes for current company --------

export async function listQuotes(): Promise<ActionResult<Quote[]>> {
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

  const { data: quotes, error } = await supabase
    .from("quotes")
    .select("*")
    .eq("company_id", company.id)
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: quotes ?? [] };
}

// -------- Update quote (edit mode save) --------

export interface UpdateQuotePayload {
  id: string;
  title: string;
  summary: string;
  timeline: string;
  line_items: {
    id?: string; // existing items
    description: string;
    quantity: number;
    unit: string;
    unit_price: number; // cents
    vat_rate: number;
    sort_order: number;
    optional?: boolean;
    default_selected?: boolean;
  }[];
}

export async function updateQuote(
  payload: UpdateQuotePayload
): Promise<ActionResult<{ newVersion?: number }>> {
  const supabase = await createClient();

  // Check current quote state — if it was already sent, we create a new version
  const { data: existingQuote } = await supabase
    .from("quotes")
    .select("status")
    .eq("id", payload.id)
    .single();

  const shouldBumpVersion =
    existingQuote?.status === "sent" || existingQuote?.status === "accepted";

  // Totals reflect default selection: non-optional + optional-selected items
  const itemsForTotals = payload.line_items.filter(
    (li) => !li.optional || li.default_selected !== false
  );
  const totals = calculateQuoteTotals(itemsForTotals);

  // Build update payload
  const quoteUpdate: Record<string, unknown> = {
    title: payload.title,
    summary: payload.summary,
    timeline: payload.timeline,
    subtotal: totals.subtotal,
    vat_amount: totals.vatAmount,
    total: totals.total,
    ai_edited: true,
  };

  // If revising a sent/accepted quote, reset status to draft
  if (shouldBumpVersion) {
    quoteUpdate.status = "draft";
    // Clear the accept/reject timestamps since this is a new revision
    quoteUpdate.accepted_at = null;
    quoteUpdate.rejected_at = null;
  }

  const { error: quoteErr } = await supabase
    .from("quotes")
    .update(quoteUpdate)
    .eq("id", payload.id);

  if (quoteErr) {
    return { success: false, error: quoteErr.message };
  }

  // Replace all line items (simpler than diffing)
  const { error: delErr } = await supabase
    .from("quote_line_items")
    .delete()
    .eq("quote_id", payload.id);

  if (delErr) {
    return { success: false, error: delErr.message };
  }

  if (payload.line_items.length > 0) {
    const lineItemRows = payload.line_items.map((li, i) => ({
      quote_id: payload.id,
      description: li.description,
      quantity: li.quantity,
      unit: li.unit,
      unit_price: li.unit_price,
      vat_rate: li.vat_rate,
      line_total: calculateLineTotal(li.quantity, li.unit_price),
      sort_order: i,
      optional: li.optional ?? false,
      default_selected: li.default_selected ?? true,
    }));

    const { error: insErr } = await supabase
      .from("quote_line_items")
      .insert(lineItemRows);

    if (insErr) {
      return { success: false, error: insErr.message };
    }
  }

  // If this is a revision, snapshot the NEW state as the next version
  if (shouldBumpVersion) {
    const versionResult = await createNewQuoteVersion(payload.id);
    if (versionResult.success && versionResult.data) {
      return { success: true, data: { newVersion: versionResult.data.versionNumber } };
    }
  }

  return { success: true, data: {} };
}

// -------- Old AI-only generator (kept for reference if needed) --------

export async function generateQuoteFromInput(
  input: string
): Promise<ActionResult<{ quote: QuoteAIResponse; rawString: string }>> {
  const parsed = PasteInputSchema.safeParse({ text: input });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data, raw } = await generateQuote(parsed.data.text);

  return { success: true, data: { quote: data, rawString: raw } };
}

// -------- Manually mark as sent --------

export async function markQuoteAsSent(
  quoteId: string
): Promise<ActionResult<void>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Fetch to verify ownership (RLS) and current status
  const { data: quote, error: fetchErr } = await supabase
    .from("quotes")
    .select("id, status")
    .eq("id", quoteId)
    .single();

  if (fetchErr || !quote) {
    return { success: false, error: "Quote not found" };
  }

  if (quote.status !== "draft") {
    return {
      success: false,
      error: `Quote is already ${quote.status}`,
    };
  }

  const { error: updateErr } = await supabase
    .from("quotes")
    .update({ status: "sent" })
    .eq("id", quoteId);

  if (updateErr) {
    return { success: false, error: updateErr.message };
  }

  revalidatePath(`/quotes/${quoteId}`);
  revalidatePath("/dashboard");

  return { success: true };
}

// -------- Send quote by email --------

export async function sendQuoteByEmail(
  quoteId: string,
  recipientEmail: string
): Promise<ActionResult<void>> {
  if (!recipientEmail || !/^\S+@\S+\.\S+$/.test(recipientEmail)) {
    return { success: false, error: "Invalid email address" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Fetch quote (RLS ensures ownership)
  const { data: quote, error: quoteErr } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", quoteId)
    .single();

  if (quoteErr || !quote) {
    return { success: false, error: "Quote not found" };
  }

  // Fetch company for name + branding
  const { data: company, error: companyErr } = await supabase
    .from("companies")
    .select("company_name")
    .eq("id", quote.company_id)
    .single();

  if (companyErr || !company) {
    return { success: false, error: "Company not found" };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const publicUrl = `${appUrl}/quote/${quote.public_id}`;

  // Send email
  const emailResult = await sendQuoteEmail({
    to: recipientEmail,
    projectTitle: quote.title,
    publicUrl,
    companyName: company.company_name,
  });

  if (!emailResult.success) {
    return { success: false, error: emailResult.error || "Email send failed" };
  }

  // Mark quote as sent, store client_email if not already set
  const updates: Record<string, string> = {};
  if (quote.status === "draft") {
    updates.status = "sent";
  }
  if (!quote.client_email) {
    updates.client_email = recipientEmail;
  }

  if (Object.keys(updates).length > 0) {
    await supabase.from("quotes").update(updates).eq("id", quoteId);
  }

  revalidatePath(`/quotes/${quoteId}`);
  revalidatePath("/dashboard");

  return { success: true };
}
