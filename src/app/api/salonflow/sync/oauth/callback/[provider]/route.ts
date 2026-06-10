import { NextResponse } from "next/server";
import { completeOAuth } from "@/lib/salonflow/sync/service";
import type { ProviderId } from "@/lib/salonflow/sync/types";

// Live OAuth redirect target. Decodes the signed state, exchanges the code, and
// finalizes the connection, then bounces back to the connections UI.
export async function GET(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) return NextResponse.json({ error: "missing code/state" }, { status: 400 });
  try {
    const { salonId, staffId } = JSON.parse(Buffer.from(state, "base64url").toString());
    await completeOAuth(salonId, staffId, provider as ProviderId, code, url.origin + url.pathname);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
  return NextResponse.redirect(url.origin + "/salonflow/settings/calendar?connected=" + provider);
}
