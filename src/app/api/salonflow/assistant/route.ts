import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { availability, getState } from "@/lib/salonflow/repo";
import { DEMO_SALON_ID } from "@/lib/salonflow/constants";
import { DAYS, fmtRange, money, type SalonState } from "@/app/salonflow/lib/types";

// Real Claude tool-using assistant. Activates only when ANTHROPIC_API_KEY is set;
// otherwise returns { configured: false } and the client falls back to the
// deterministic rule-based engine. The agent calls the SAME read paths a human
// would and PROPOSES bookings behind the UI's confirm gate — it never writes
// directly, so tenant scoping and the confirmation step are preserved.
// See docs/salonflow/06-ai-assistant.md.

export const dynamic = "force-dynamic";
const MODEL = "claude-opus-4-8";

type Proposal = { serviceId: string; staffId: string; clientId: string; day: number; start: number; label: string };

/* eslint-disable @typescript-eslint/no-explicit-any */
const TOOLS: any[] = [
  { name: "search_clients", description: "Find clients by name, email, or phone. Call this to resolve who the user means before proposing a booking.", input_schema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
  { name: "get_metrics", description: "Get this week's revenue, booking counts, no-shows, and booking-source split.", input_schema: { type: "object", properties: {} } },
  { name: "list_inactive_clients", description: "List clients flagged for win-back (haven't booked recently).", input_schema: { type: "object", properties: {} } },
  { name: "find_availability", description: "Get free start times (decimal hours, 24h) for a service with a staff member on a day index (0=Wed..6=Tue).", input_schema: { type: "object", properties: { serviceId: { type: "string" }, staffId: { type: "string" }, day: { type: "number" } }, required: ["serviceId", "staffId", "day"] } },
  { name: "propose_booking", description: "Propose an appointment for the user to confirm. Always confirm the slot is free with find_availability first. Day index 0=Wed..6=Tue. start is a decimal hour (e.g. 14.5 = 2:30 PM).", input_schema: { type: "object", properties: { clientId: { type: "string" }, serviceId: { type: "string" }, staffId: { type: "string" }, day: { type: "number" }, start: { type: "number" } }, required: ["clientId", "serviceId", "staffId", "day", "start"] } },
];

function systemPrompt(s: SalonState): string {
  const services = s.services.map((x) => `${x.name} (id=${x.id}, ${x.durationMin}min, ${money(x.priceMinor, s.settings.currency)})`).join("; ");
  const staff = s.staff.map((x) => `${x.name} (id=${x.id}, does ${x.serviceIds.length} services)`).join("; ");
  return [
    `You are the assistant for ${s.settings.name}, a salon. Be concise and friendly.`,
    `Day indices: 0=Wed 13, 1=Thu 14, 2=Fri 15, 3=Sat 16, 4=Sun 17, 5=Mon 18, 6=Tue 19 (current demo week).`,
    `Services: ${services}.`,
    `Staff: ${staff}.`,
    `When asked to book, resolve the client with search_clients, pick a service+staff, verify the slot with find_availability, then call propose_booking. Never claim something is booked — the user confirms the proposal in the UI.`,
    `For analytics questions, use get_metrics or list_inactive_clients and answer in one or two sentences.`,
  ].join("\n");
}

async function runTool(name: string, input: any, state: SalonState): Promise<{ result: string; proposal?: Proposal }> {
  switch (name) {
    case "search_clients": {
      const q = String(input.query ?? "").toLowerCase();
      const matches = state.clients.filter((c) => `${c.firstName} ${c.lastName} ${c.email} ${c.phone}`.toLowerCase().includes(q)).slice(0, 5);
      return { result: JSON.stringify(matches.map((c) => ({ id: c.id, name: `${c.firstName} ${c.lastName}`, tier: c.tier }))) };
    }
    case "get_metrics": {
      const active = state.appointments.filter((a) => a.status !== "cancelled");
      const rev = active.reduce((s, a) => s + (state.services.find((x) => x.id === a.serviceId)?.priceMinor ?? 0), 0);
      return { result: JSON.stringify({ revenue: money(rev, state.settings.currency), bookings: active.length, noShows: state.appointments.filter((a) => a.status === "no_show").length, online: active.filter((a) => a.source === "online").length, ai: active.filter((a) => a.source === "ai").length }) };
    }
    case "list_inactive_clients":
      return { result: JSON.stringify(state.clients.filter((c) => c.tags.includes("Win-back")).map((c) => `${c.firstName} ${c.lastName}`)) };
    case "find_availability": {
      const slots = await availability(DEMO_SALON_ID, input.serviceId, input.staffId, Number(input.day));
      return { result: JSON.stringify({ slots }) };
    }
    case "propose_booking": {
      const svc = state.services.find((x) => x.id === input.serviceId);
      const stf = state.staff.find((x) => x.id === input.staffId);
      const cl = state.clients.find((x) => x.id === input.clientId);
      if (!svc || !stf || !cl) return { result: "Error: unknown service, staff, or client id." };
      const day = Number(input.day); const start = Number(input.start);
      const slots = await availability(DEMO_SALON_ID, input.serviceId, input.staffId, day);
      if (!slots.includes(Math.round(start * 4) / 4)) return { result: "That slot isn't free. Call find_availability and pick an open start time." };
      const label = `${svc.name} for ${cl.firstName} ${cl.lastName} with ${stf.name} · ${DAYS[day]?.label} ${DAYS[day]?.date}, ${fmtRange(start, start).split(" - ")[0]} · ${money(svc.priceMinor, state.settings.currency)}`;
      return { result: "Proposal ready — shown to the user for confirmation.", proposal: { serviceId: input.serviceId, staffId: input.staffId, clientId: input.clientId, day, start, label } };
    }
    default:
      return { result: "Unknown tool." };
  }
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ configured: false });

  const { messages } = (await req.json()) as { messages: { role: "user" | "assistant"; content: string }[] };
  const state = await getState(DEMO_SALON_ID);
  const client = new Anthropic();

  const convo: Anthropic.MessageParam[] = messages.map((m) => ({ role: m.role, content: m.content }));
  let proposal: Proposal | undefined;
  let text = "";

  for (let i = 0; i < 6; i++) {
    const res = await client.messages.create({ model: MODEL, max_tokens: 1024, system: systemPrompt(state), tools: TOOLS, messages: convo });
    const toolUses = res.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
    text = res.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("\n").trim();
    if (res.stop_reason !== "tool_use" || toolUses.length === 0) break;

    convo.push({ role: "assistant", content: res.content });
    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const tu of toolUses) {
      const out = await runTool(tu.name, tu.input, state);
      if (out.proposal) proposal = out.proposal;
      results.push({ type: "tool_result", tool_use_id: tu.id, content: out.result });
    }
    convo.push({ role: "user", content: results });
  }

  return NextResponse.json({ configured: true, message: text || "Done.", proposal });
}
