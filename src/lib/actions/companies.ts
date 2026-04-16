"use server";

import { createClient } from "@/lib/supabase/server";
import { CompanyOnboardingSchema } from "@/lib/validations";
import type { ActionResult, Company } from "@/types";

export async function createCompany(
  formData: unknown
): Promise<ActionResult<Company>> {
  const parsed = CompanyOnboardingSchema.safeParse(formData);
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

  const { data, error } = await supabase
    .from("companies")
    .insert({
      user_id: user.id,
      company_name: parsed.data.company_name,
      address: parsed.data.address,
      postal_code: parsed.data.postal_code,
      city: parsed.data.city,
      vat_number: parsed.data.vat_number,
      iban: parsed.data.iban,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

export async function getCompany(): Promise<ActionResult<Company>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

export interface UpdateCompanyPayload {
  company_name: string;
  address: string;
  postal_code: string;
  city: string;
  vat_number: string;
  iban: string;
  logo_url: string;
  brand_color_primary: string;
}

export async function updateCompany(
  payload: UpdateCompanyPayload
): Promise<ActionResult<Company>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("companies")
    .update({
      company_name: payload.company_name,
      address: payload.address,
      postal_code: payload.postal_code,
      city: payload.city,
      vat_number: payload.vat_number,
      iban: payload.iban,
      logo_url: payload.logo_url || null,
      brand_color_primary: payload.brand_color_primary || null,
    })
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}
