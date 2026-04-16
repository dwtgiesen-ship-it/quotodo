"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult } from "@/types";

// Public accept action — no auth required, uses admin client (bypasses RLS).
// Only allowed if quote is currently in "draft" or "sent" status.
export async function acceptQuote(publicId: string): Promise<ActionResult<void>> {
  return acceptQuoteWithSelection(publicId, null, null);
}

/**
 * Accept a quote with an explicit client-side selection of line items.
 *
 * Behavior:
 *  - Marks the quote as accepted
 *  - Stores `accepted_selection` (array of line_item IDs) and `accepted_total` on the quote
 *  - Creates a new version snapshot containing ONLY the selected line items — this is
 *    the authoritative version for invoicing. The previous version remains in history.
 *
 * If selectedIds is null, all non-optional items are used (backwards compat).
 */
export async function acceptQuoteWithSelection(
  publicId: string,
  selectedIds: string[] | null,
  acceptedTotalCents: number | null
): Promise<ActionResult<void>> {
  const supabase = createAdminClient();

  const { data: quote, error: fetchErr } = await supabase
    .from("quotes")
    .select("*")
    .eq("public_id", publicId)
    .single();

  if (fetchErr || !quote) {
    return { success: false, error: "Quote not found" };
  }

  if (quote.status !== "draft" && quote.status !== "sent") {
    return { success: false, error: "Quote is not pending a decision" };
  }

  // Fetch line items (bypasses RLS since we use admin client)
  const { data: allItems, error: itemsErr } = await supabase
    .from("quote_line_items")
    .select("*")
    .eq("quote_id", quote.id)
    .order("sort_order", { ascending: true });

  if (itemsErr) {
    return { success: false, error: itemsErr.message };
  }

  // Resolve which items the client selected.
  // Required items are always included regardless of input.
  const items = allItems ?? [];
  const resolvedSelection =
    selectedIds === null
      ? items.filter((li) => !li.optional).map((li) => li.id)
      : items
          .filter((li) => !li.optional || selectedIds.includes(li.id))
          .map((li) => li.id);

  // Compute totals from resolved selection (server-authoritative)
  const selectedItems = items.filter((li) => resolvedSelection.includes(li.id));
  let subtotal = 0;
  let vatAmount = 0;
  for (const li of selectedItems) {
    const lt = Math.round(li.quantity * li.unit_price);
    subtotal += lt;
    vatAmount += Math.round(lt * (li.vat_rate / 100));
  }
  const total = subtotal + vatAmount;

  // If client sent a total, sanity-check it matches (prevents tampering)
  if (
    acceptedTotalCents !== null &&
    Math.abs(acceptedTotalCents - total) > 1
  ) {
    // Don't error — client may have old data; trust server value silently
  }

  // Update quote: mark accepted + store selection + snapshot total
  const { error: updateErr } = await supabase
    .from("quotes")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
      accepted_selection: resolvedSelection,
      accepted_total: total,
      subtotal,
      vat_amount: vatAmount,
      total,
    })
    .eq("id", quote.id);

  if (updateErr) {
    return { success: false, error: updateErr.message };
  }

  // Create a new version snapshot with ONLY the selected items —
  // this becomes the authoritative version for invoicing.
  const hasOptional = items.some((li) => li.optional);
  if (hasOptional) {
    const nextVersion = (quote.current_version ?? 1) + 1;

    const snapshot = {
      title: quote.title,
      summary: quote.summary,
      client_name: quote.client_name,
      client_email: quote.client_email,
      scope_included: quote.scope_included,
      scope_excluded: quote.scope_excluded,
      timeline: quote.timeline,
      subtotal,
      vat_amount: vatAmount,
      total,
      currency: quote.currency,
      payment_terms: quote.payment_terms,
      notes: quote.notes,
      line_items: selectedItems.map((li) => ({
        description: li.description,
        quantity: li.quantity,
        unit: li.unit,
        unit_price: li.unit_price,
        vat_rate: li.vat_rate,
        line_total: Math.round(li.quantity * li.unit_price),
      })),
    };

    await supabase.from("quote_versions").insert({
      quote_id: quote.id,
      version_number: nextVersion,
      data: snapshot,
    });

    await supabase
      .from("quotes")
      .update({ current_version: nextVersion })
      .eq("id", quote.id);
  }

  revalidatePath(`/quote/${publicId}`);
  return { success: true };
}

// -------- Accept + auto-create invoice (for deposit flow) --------

export interface AcceptAndInvoiceResult {
  invoiceId: string;
  invoiceNumber: string;
  depositAmount: number;
  depositPercent: number;
  total: number;
  currency: string;
  companyIban: string;
  companyName: string;
}

/**
 * Client accepts a quote AND triggers invoice creation so they can pay a deposit.
 * Combines acceptQuoteWithSelection + invoice creation in a single public action.
 */
export async function acceptAndCreateInvoice(
  publicId: string,
  selectedIds: string[] | null,
  acceptedTotalCents: number | null
): Promise<ActionResult<AcceptAndInvoiceResult>> {
  const supabase = createAdminClient();

  // First run the accept flow
  const acceptRes = await acceptQuoteWithSelection(
    publicId,
    selectedIds,
    acceptedTotalCents
  );
  if (!acceptRes.success) {
    return { success: false, error: acceptRes.error };
  }

  // Re-fetch quote to get the post-accept state (status + totals + selection)
  const { data: quote } = await supabase
    .from("quotes")
    .select("*")
    .eq("public_id", publicId)
    .single();

  if (!quote) {
    return { success: false, error: "Quote not found after accept" };
  }

  // Check for existing invoice for this quote
  const { data: existingInvoice } = await supabase
    .from("invoices")
    .select("*")
    .eq("quote_id", quote.id)
    .maybeSingle();

  // Fetch company for deposit config + IBAN/name
  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("id", quote.company_id)
    .single();

  if (!company) {
    return { success: false, error: "Company not found" };
  }

  let invoice = existingInvoice;

  if (!invoice) {
    // Fetch line items, filter by accepted selection
    const { data: allItems } = await supabase
      .from("quote_line_items")
      .select("*")
      .eq("quote_id", quote.id)
      .order("sort_order", { ascending: true });

    const sourceItems = (allItems ?? []).filter((li) => {
      if (quote.accepted_selection && Array.isArray(quote.accepted_selection)) {
        return quote.accepted_selection.includes(li.id);
      }
      return !li.optional || li.default_selected;
    });

    const invoiceLineItems = sourceItems.map((li) => ({
      description: li.description,
      quantity: li.quantity,
      unit: li.unit,
      unit_price: li.unit_price,
      vat_rate: li.vat_rate,
      line_total: li.line_total,
    }));

    // Recalculate totals for safety
    let subtotal = 0;
    let vatAmount = 0;
    for (const li of invoiceLineItems) {
      subtotal += li.line_total;
      vatAmount += Math.round(li.line_total * (li.vat_rate / 100));
    }
    const total = subtotal + vatAmount;

    const { data: invoiceNumber } = await supabase.rpc(
      "generate_invoice_number",
      { p_company_id: quote.company_id }
    );

    const now = new Date();
    const issuedAt = now.toISOString().split("T")[0];
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + (quote.payment_terms ?? 30));
    const dueDateStr = dueDate.toISOString().split("T")[0];

    const depositPercent = company.default_deposit_percent ?? 30;
    const depositAmount = Math.round(total * (depositPercent / 100));

    const { data: newInvoice, error: insErr } = await supabase
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
        subtotal,
        vat_amount: vatAmount,
        total,
        currency: quote.currency,
        payment_terms: quote.payment_terms,
        status: "draft",
        issued_at: issuedAt,
        due_date: dueDateStr,
        deposit_required_percent: depositPercent,
        deposit_amount: depositAmount,
      })
      .select("*")
      .single();

    if (insErr || !newInvoice) {
      return {
        success: false,
        error: "Failed to create invoice: " + (insErr?.message ?? "unknown"),
      };
    }

    invoice = newInvoice;
  }

  revalidatePath(`/quote/${publicId}`);
  revalidatePath(`/invoices/${invoice.id}`);
  revalidatePath("/invoices");
  revalidatePath("/dashboard");

  return {
    success: true,
    data: {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      depositAmount: invoice.deposit_amount,
      depositPercent: invoice.deposit_required_percent,
      total: invoice.total,
      currency: invoice.currency,
      companyIban: company.iban,
      companyName: company.company_name,
    },
  };
}

// Public lookup: find the deposit info for a given quote (if an invoice exists).
export async function getDepositInfoForQuote(
  publicId: string
): Promise<
  ActionResult<AcceptAndInvoiceResult & { depositPaid: boolean } | null>
> {
  const supabase = createAdminClient();

  const { data: quote } = await supabase
    .from("quotes")
    .select("id, company_id")
    .eq("public_id", publicId)
    .single();

  if (!quote) return { success: true, data: null };

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*")
    .eq("quote_id", quote.id)
    .maybeSingle();

  if (!invoice) return { success: true, data: null };

  const { data: company } = await supabase
    .from("companies")
    .select("iban, company_name")
    .eq("id", quote.company_id)
    .single();

  if (!company) return { success: true, data: null };

  return {
    success: true,
    data: {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      depositAmount: invoice.deposit_amount,
      depositPercent: invoice.deposit_required_percent,
      total: invoice.total,
      currency: invoice.currency,
      companyIban: company.iban,
      companyName: company.company_name,
      depositPaid: invoice.deposit_paid,
    },
  };
}

// Public reject action — same constraints as accept.
export async function rejectQuote(publicId: string): Promise<ActionResult<void>> {
  const supabase = createAdminClient();

  const { data: quote, error: fetchErr } = await supabase
    .from("quotes")
    .select("id, status")
    .eq("public_id", publicId)
    .single();

  if (fetchErr || !quote) {
    return { success: false, error: "Quote not found" };
  }

  if (quote.status !== "draft" && quote.status !== "sent") {
    return { success: false, error: "Quote is not pending a decision" };
  }

  const { error: updateErr } = await supabase
    .from("quotes")
    .update({
      status: "rejected",
      rejected_at: new Date().toISOString(),
    })
    .eq("id", quote.id);

  if (updateErr) {
    return { success: false, error: updateErr.message };
  }

  revalidatePath(`/quote/${publicId}`);
  return { success: true };
}
