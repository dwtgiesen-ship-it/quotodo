// The single demo tenant. In production this comes from the authenticated
// Clerk org (see docs/salonflow/04-api-and-auth.md); here it's a fixed id so the
// API is credential-free.
export const DEMO_SALON_ID = "salon-demo";

/**
 * The tenant seam. Every API route scopes data through this. Today it returns the
 * demo tenant; wiring real auth is a one-file change — no route needs to change:
 *
 *   import { auth } from "@clerk/nextjs/server";
 *   export async function getSalonId() {
 *     const { orgId } = await auth();
 *     if (!orgId) throw new Error("Unauthenticated");
 *     return orgId; // = Salon.id, enforced by Postgres RLS (docs/salonflow/02 §3)
 *   }
 */
export async function getSalonId(): Promise<string> {
  return DEMO_SALON_ID;
}
