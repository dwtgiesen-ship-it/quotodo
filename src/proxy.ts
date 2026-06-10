import { type NextRequest, NextResponse } from "next/server";

// Schedulemode preview gate: a simple shared-password (HTTP Basic) over the app
// so a public preview URL isn't wide open. Active only when PREVIEW_PASS is set,
// so local dev and production (with real accounts) stay ungated unless you opt
// in. Provider webhooks are excluded (they can't send a Basic Auth header).
function previewGate(request: NextRequest): NextResponse | null {
  const pass = process.env.PREVIEW_PASS;
  if (!pass) return null; // gate disabled when not configured
  if (request.nextUrl.pathname.startsWith("/api/salonflow/sync/webhook")) return null;
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

export function proxy(request: NextRequest) {
  return previewGate(request) ?? NextResponse.next();
}

export const config = {
  matcher: [
    "/sf",
    "/sf/:path*",
    "/salonflow/:path*",
    "/api/salonflow/:path*",
  ],
};
