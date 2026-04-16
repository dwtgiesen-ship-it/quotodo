"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult } from "@/types";

// Public accept action — no auth required, uses admin client (bypasses RLS).
// Only allowed if quote is currently in "draft" or "sent" status.
export async function acceptQuote(publicId: string): Promise<ActionResult<void>> {
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
      status: "accepted",
      accepted_at: new Date().toISOString(),
    })
    .eq("id", quote.id);

  if (updateErr) {
    return { success: false, error: updateErr.message };
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
