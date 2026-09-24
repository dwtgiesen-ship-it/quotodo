// Tiny single-user lock. When APP_PASSWORD is set, every page and API route
// requires a cookie holding a hash of that password (set by /login). Without
// APP_PASSWORD the app is open — fine locally, NOT on a public URL.

export const AUTH_COOKIE = "kk_auth";

export async function authToken(password: string): Promise<string> {
  const data = new TextEncoder().encode(`kofferklaar:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}
