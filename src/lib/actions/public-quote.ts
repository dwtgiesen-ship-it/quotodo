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
