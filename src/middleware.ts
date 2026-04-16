import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Protected app routes — require auth + company
const PROTECTED_PREFIXES = ["/dashboard", "/quotes", "/invoices", "/settings"];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );
}

export async function middleware(request: NextRequest) {
  const { user, supabaseResponse, supabase } = await updateSession(request);
  const { pathname } = request.nextUrl;

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
  ],
};
