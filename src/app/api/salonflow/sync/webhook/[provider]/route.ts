import { NextResponse } from "next/server";
import { ingestWebhook } from "@/lib/salonflow/sync/service";
import type { ProviderId } from "@/lib/salonflow/sync/types";

// Provider webhook receiver. Microsoft Graph requires a validationToken handshake
// on subscription creation; Google sends change notifications via headers. Both
// carry a clientState/token we verify before enqueuing a pull.
export async function POST(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const url = new URL(req.url);

  // Microsoft Graph subscription validation handshake
  const validationToken = url.searchParams.get("validationToken");
  if (validationToken) return new Response(validationToken, { status: 200, headers: { "Content-Type": "text/plain" } });

  if (provider === "google") {
    const channelId = req.headers.get("x-goog-channel-id") ?? "";
    const state = req.headers.get("x-goog-resource-state") ?? "";
    const token = req.headers.get("x-goog-channel-token") ?? "";
    if (state === "sync") return new Response(null, { status: 200 }); // initial sync ping
    const r = await ingestWebhook("google", channelId, token);
    return NextResponse.json(r, { status: r.ok ? 202 : 400 });
  }

  if (provider === "microsoft") {
    const body = (await req.json().catch(() => ({}))) as { value?: { subscriptionId: string; clientState: string }[] };
    for (const n of body.value ?? []) await ingestWebhook("microsoft", n.subscriptionId, n.clientState);
    return new Response(null, { status: 202 });
  }

  return new Response(null, { status: 404 }); // apple is poll-only
}
