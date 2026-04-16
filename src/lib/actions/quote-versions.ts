"use server";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult, QuoteVersion, QuoteVersionSnapshot } from "@/types";

/**
 * Build a snapshot from a quote row + line items.
 * Used internally by createNewQuoteVersion.
 */
function buildSnapshot(
  quote: Record<string, unknown>,
  lineItems: Array<Record<string, unknown>>
): QuoteVersionSnapshot {
  return {
    title: (quote.title as string) ?? "",
    summary: (quote.summary as string) ?? null,
    client_name: (quote.client_name as string) ?? "",
    client_email: (quote.client_email as string) ?? null,
    scope_included: (quote.scope_included as string[]) ?? [],
    scope_excluded: (quote.scope_excluded as string[]) ?? [],
    timeline: (quote.timeline as string) ?? null,
    subtotal: (quote.subtotal as number) ?? 0,
    vat_amount: (quote.vat_amount as number) ?? 0,
    total: (quote.total as number) ?? 0,
    currency: (quote.currency as string) ?? "EUR",
    payment_terms: (quote.payment_terms as number) ?? 30,
    notes: (quote.notes as string) ?? null,
    line_items: lineItems.map((li) => ({
      description: (li.description as string) ?? "",
      quantity: (li.quantity as number) ?? 1,
      unit: (li.unit as string) ?? "per stuk",
      unit_price: (li.unit_price as number) ?? 0,
      vat_rate: (li.vat_rate as number) ?? 21,
      line_total: (li.line_total as number) ?? 0,
    })),
  };
}

/**
 * Snapshot the current quote state as a new version row.
 * Does NOT increment current_version — caller is responsible for that if needed.
 */
export async function snapshotQuoteAsVersion(
  quoteId: string,
  versionNumber: number
): Promise<ActionResult<void>> {
  const supabase = await createClient();

  const { data: quote, error: qErr } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", quoteId)
    .single();

  if (qErr || !quote) {
    return { success: false, error: "Quote not found" };
  }

  const { data: lineItems, error: liErr } = await supabase
    .from("quote_line_items")
    .select("*")
    .eq("quote_id", quoteId)
    .order("sort_order", { ascending: true });

  if (liErr) {
    return { success: false, error: liErr.message };
  }

  const snapshot = buildSnapshot(quote, lineItems ?? []);

  const { error: insErr } = await supabase
    .from("quote_versions")
    .insert({
      quote_id: quoteId,
      version_number: versionNumber,
      data: snapshot,
    });

  if (insErr) {
    // If already exists (duplicate), that's fine — just skip
    if (insErr.code === "23505") return { success: true };
    return { success: false, error: insErr.message };
  }

  return { success: true };
}

/**
 * Snapshot the CURRENT state of a quote as the NEXT version.
 * Increments current_version on the quote.
 * Used by updateQuote when a sent/accepted quote is being revised.
 */
export async function createNewQuoteVersion(
  quoteId: string
): Promise<ActionResult<{ versionNumber: number }>> {
  const supabase = await createClient();

  const { data: quote } = await supabase
    .from("quotes")
    .select("current_version")
    .eq("id", quoteId)
    .single();

  if (!quote) {
    return { success: false, error: "Quote not found" };
  }

  const nextVersion = (quote.current_version ?? 1) + 1;

  const snap = await snapshotQuoteAsVersion(quoteId, nextVersion);
  if (!snap.success) return { success: false, error: snap.error };

  const { error: updErr } = await supabase
    .from("quotes")
    .update({ current_version: nextVersion })
    .eq("id", quoteId);

  if (updErr) {
    return { success: false, error: updErr.message };
  }

  return { success: true, data: { versionNumber: nextVersion } };
}

/** List all versions for a quote (newest first). */
export async function listQuoteVersions(
  quoteId: string
): Promise<ActionResult<QuoteVersion[]>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quote_versions")
    .select("*")
    .eq("quote_id", quoteId)
    .order("version_number", { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: (data ?? []) as QuoteVersion[] };
}

/** Get a specific version by number. */
export async function getQuoteVersion(
  quoteId: string,
  versionNumber: number
): Promise<ActionResult<QuoteVersion>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quote_versions")
    .select("*")
    .eq("quote_id", quoteId)
    .eq("version_number", versionNumber)
    .single();

  if (error || !data) {
    return { success: false, error: "Version not found" };
  }

  return { success: true, data: data as QuoteVersion };
}

/**
 * Compute a simple diff between two snapshots.
 * Returns a list of human-readable change strings.
 */
export async function diffSnapshots(
  older: QuoteVersionSnapshot,
  newer: QuoteVersionSnapshot
): Promise<string[]> {
  const changes: string[] = [];

  if (older.title !== newer.title) {
    changes.push(`Title changed`);
  }
  if ((older.summary ?? "") !== (newer.summary ?? "")) {
    changes.push(`Summary updated`);
  }
  if ((older.timeline ?? "") !== (newer.timeline ?? "")) {
    changes.push(`Timeline updated`);
  }
  if (older.total !== newer.total) {
    const direction = newer.total > older.total ? "increased" : "decreased";
    changes.push(`Total ${direction}`);
  }
  if (older.line_items.length !== newer.line_items.length) {
    const direction =
      newer.line_items.length > older.line_items.length ? "added" : "removed";
    const diff = Math.abs(newer.line_items.length - older.line_items.length);
    changes.push(`${diff} line item${diff === 1 ? "" : "s"} ${direction}`);
  } else {
    const itemsChanged = older.line_items.some(
      (li, i) =>
        li.description !== newer.line_items[i]?.description ||
        li.quantity !== newer.line_items[i]?.quantity ||
        li.unit_price !== newer.line_items[i]?.unit_price
    );
    if (itemsChanged) {
      changes.push(`Line items modified`);
    }
  }
  if (
    JSON.stringify(older.scope_included) !== JSON.stringify(newer.scope_included)
  ) {
    changes.push(`Included scope updated`);
  }
  if (
    JSON.stringify(older.scope_excluded) !== JSON.stringify(newer.scope_excluded)
  ) {
    changes.push(`Excluded scope updated`);
  }
  if (older.payment_terms !== newer.payment_terms) {
    changes.push(`Payment terms updated`);
  }

  return changes;
}
