import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the service role key.
 * Bypasses RLS — use ONLY for routes that need to read data
 * without a user session (e.g. public quote sharing).
 *
 * NEVER import this from client components.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
