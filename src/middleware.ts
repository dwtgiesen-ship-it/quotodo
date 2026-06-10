import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Protected app routes — require auth + company
const PROTECTED_PREFIXES = ["/dashboard", "/quotes", "/invoices", "/settings"];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );
}

// Schedulemode preview gate: a simple shared-password (HTTP Basic) over the demo so
// a public preview URL isn't wide open. Active only when PREVIEW_PASS is set, so
// local dev stays ungated. Provider webhooks are excluded (no Basic Auth header).
function isPreviewPath(pathname: string): boolean {
  return pathname === "/sf" || pathname.startsWith("/sf/") || pathname.startsWith("/salonflow") || pathname.startsWith("/api/salonflow");
}

function previewGate(request: NextRequest): NextResponse | null {
  const pass = process.env.PREVIEW_PASS;
  if (!pass) return null; // gate disabled when not configured
  if (request.nextUrl.pathname.startsWith("/api/salonflow/sync/webhook")) return null; // providers can't send Basic Auth
  const user = process.env.PREVIEW_USER ?? "salon";
  const header = request.headers.get("authorization") ?? "";
  if (header.startsWith("Basic ")) {
    try {
      const [u, p] = atob(header.slice(6)).split(":");
      if (u === user && p === pass) return null; // authorized
    } catch { /* fall through to 401 */ }
  }
  return new NextResponse("Authentication required", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="Schedulemode Preview", charset="UTF-8"' } });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Schedulemode lives entirely outside the Supabase/quotodo auth — gate it on its own
  // and return, never invoking updateSession (which needs Supabase env).
  if (isPreviewPath(pathname)) {
    return previewGate(request) ?? NextResponse.next();
  }

  const { user, supabaseResponse, supabase } = await updateSession(request);

  // Public routes — let through unchanged
  // (login, auth callback, API, public quote share, onboarding no-auth handled below)
  const needsAuth = isProtected(pathname) || pathname.startsWith("/onboarding");
  if (!needsAuth) {
    return supabaseResponse;
  }

  // Not authenticated — redirect to login with return URL
  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check if user has a company
  const { data: company } = await supabase
    .from("companies")
    .select("id")
    .eq("user_id", user.id)
    .single();

  // Onboarding: allow if no company, bounce to dashboard if they already have one
  if (pathname.startsWith("/onboarding")) {
    if (company) {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = "/dashboard";
      return NextResponse.redirect(dashboardUrl);
    }
    return supabaseResponse;
  }

  // Protected routes — require company
  if (isProtected(pathname) && !company) {
    const onboardingUrl = request.nextUrl.clone();
    onboardingUrl.pathname = "/onboarding";
    return NextResponse.redirect(onboardingUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/quotes/:path*",
    "/invoices/:path*",
    "/settings/:path*",
    "/onboarding/:path*",
    "/sf",
    "/sf/:path*",
    "/salonflow/:path*",
    "/api/salonflow/:path*",
  ],
};
