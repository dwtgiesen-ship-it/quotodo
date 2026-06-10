"use client";

// Schedulemode assistant — working demo. This is a deterministic, rule-based stand-in for the
// production Claude tool-using agent described in docs/salonflow/06-ai-assistant.md. It reads
// the live store and performs REAL actions (booking writes to the calendar) behind a
// confirmation card — exactly the UX the production agent uses, minus the LLM.

import { useRef, useState } from "react";
import Link from "next/link";
import { Send, Sparkles } from "lucide-react";
import { useSalon } from "../lib/store";
import { DAYS, fmtRange, money, type Appointment } from "../lib/types";

type Proposal = {
  serviceId: string;
  staffId: string;
  clientId: string;
  day: number;
  start: number;
  label: string;
};

type Msg = {
  role: "user" | "assistant";
  text: string;
  proposal?: Proposal;
  booked?: boolean;
  link?: { href: string; label: string };
};

const SUGGESTIONS = [
  "How much revenue did we make this week?",
  "Who hasn't booked recently?",
  "Which day is quietest next week?",
  "Book a Custom Facial for Mark with Andre on Friday at 2pm",
];

export default function AssistantPage() {
  const salon = useSalon();
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", text: `Hi! I'm your Schedulemode assistant. I can answer questions about ${salon.state.settings.name} and book appointments for you. Try one of the suggestions below.` },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  function scroll() {
    requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: "smooth" }));
  }

  async function send(text: string) {
    if (!text.trim() || busy) return;
    const userMsg: Msg = { role: "user", text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setBusy(true);
    scroll();
    try {
      // Try the real Claude agent; it returns { configured:false } when no API key is set.
      const apiMessages = history
        .slice(history.findIndex((m) => m.role === "user"))
        .map((m) => ({ role: m.role, content: m.text }));
      const res = await fetch("/api/salonflow/assistant", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: apiMessages }) });
      const data = await res.json();
      if (res.ok && data.configured) {
        setMessages((m) => [...m, { role: "assistant", text: data.message, proposal: data.proposal }]);
      } else {
        setMessages((m) => [...m, respond(text, salon)]);
      }
    } catch {
      setMessages((m) => [...m, respond(text, salon)]);
    } finally {
      setBusy(false);
      scroll();
    }
  }

  function confirmBooking(idx: number, p: Proposal) {
    const res = salon.book({ serviceId: p.serviceId, staffId: p.staffId, clientId: p.clientId, day: p.day, start: p.start, source: "ai" });
    setMessages((m) =>
      m.map((msg, i) => (i === idx ? { ...msg, booked: true } : msg)).concat(
        res.ok
          ? [{ role: "assistant", text: `Done — ${p.label} is on the calendar and a confirmation would go out by SMS & email.`, link: { href: "/salonflow/calendar", label: "View on calendar" } }]
          : [{ role: "assistant", text: `I couldn't book that: ${res.reason}` }],
      ),
    );
    scroll();
  }

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col px-4 py-4">
      <div className="min-h-0 flex-1 space-y-3 overflow-auto pb-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed ${m.role === "user" ? "bg-[#1f2a4d] text-white" : "border border-[#e6e7e7] bg-white text-[#2c2f2e]"}`}>
              {m.role === "assistant" && (
                <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#8B5FB8]">
                  <Sparkles className="size-3.5" /> Assistant
                </div>
              )}
              <p className="whitespace-pre-wrap">{m.text}</p>
              {m.proposal && !m.booked && (
                <div className="mt-3 rounded-xl bg-[#f6f8fc] p-3">
                  <div className="text-[13px] font-medium text-[#2c2f2e]">{m.proposal.label}</div>
                  <div className="mt-2 flex gap-2">
                    <button onClick={() => confirmBooking(i, m.proposal!)} className="rounded-lg bg-[#1f2a4d] px-3 py-1.5 text-[12px] font-medium text-white">Confirm booking</button>
                    <span className="self-center text-[11px] text-[#9fa5a4]">Nothing is booked until you confirm.</span>
                  </div>
                </div>
              )}
              {m.booked && <div className="mt-2 text-[12px] font-medium text-[#4F9A57]">✓ Booked</div>}
              {m.link && <Link href={m.link.href} className="mt-2 inline-block text-[13px] font-medium text-[#5777B0] hover:underline">{m.link.label} →</Link>}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-[#e6e7e7] bg-white px-4 py-3">
              <div className="flex items-center gap-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="size-1.5 animate-bounce rounded-full bg-[#9fa5a4]" style={{ animationDelay: `${i * 120}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="shrink-0">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => send(s)} className="rounded-full border border-[#e6e7e7] bg-white px-3 py-1.5 text-[12px] text-[#6b7280] hover:bg-[#f8f9f9]">{s}</button>
          ))}
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="flex items-center gap-2 rounded-xl border border-[#e6e7e7] bg-white p-1.5"
        >
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask anything, or say “book …”" className="flex-1 bg-transparent px-3 py-1.5 text-[14px] outline-none placeholder:text-[#9fa5a4]" />
          <button type="submit" className="grid size-9 place-items-center rounded-lg bg-[#1f2a4d] text-white"><Send className="size-4" /></button>
        </form>
        <p className="mt-1.5 text-center text-[11px] text-[#9fa5a4]">Demo assistant (rule-based). Production swaps in a Claude tool-using agent — see docs/salonflow/06.</p>
      </div>
    </div>
  );
}

// ── rule-based "agent" ────────────────────────────────────────────────────────
function respond(text: string, salon: ReturnType<typeof useSalon>): Msg {
  const q = text.toLowerCase();
  const { state, serviceById } = salon;
  const active = state.appointments.filter((a) => a.status !== "cancelled");

  // Booking intent
  if (/\b(book|schedule|add)\b/.test(q)) {
    const proposal = parseBooking(text, salon);
    if (proposal) return { role: "assistant", text: `Here's what I'll book — please review:`, proposal };
    return { role: "assistant", text: "I can book that — tell me the client, service, staff member, day and time. For example: “Book a Custom Facial for Mark with Andre on Friday at 2pm.”" };
  }

  // Revenue
  if (/(revenue|made|earn|sales|takings)/.test(q)) {
    const rev = active.reduce((s, a) => s + (serviceById(a.serviceId)?.priceMinor ?? 0), 0);
    return { role: "assistant", text: `This week you have ${active.length} active appointments worth ${money(rev, state.settings.currency)} in services. ${state.appointments.filter((a) => a.source === "online").length} were booked online and ${state.appointments.filter((a) => a.source === "ai").length} by me.`, link: { href: "/salonflow/dashboard", label: "Open dashboard" } };
  }

  // Inactive / win-back
  if (/(haven.?t booked|inactive|win.?back|lapsed|recently)/.test(q)) {
    const winback = state.clients.filter((c) => c.tags.includes("Win-back"));
    const names = winback.map((c) => `${c.firstName} ${c.lastName}`).join(", ") || "none right now";
    return { role: "assistant", text: `${winback.length} client(s) are flagged for win-back: ${names}. Want me to draft a “we miss you — 15% off” campaign? (I'll show it for your approval first.)` };
  }

  // Quietest day
  if (/(quiet|empty|slow|gap|free|least busy)/.test(q)) {
    const counts = DAYS.map((d, i) => ({ d, n: active.filter((a) => a.day === i).length }));
    const min = counts.reduce((a, b) => (b.n < a.n ? b : a));
    return { role: "assistant", text: `${min.d.label} ${min.d.date} is your quietest day with ${min.n} appointment(s). I can promote a slow-day discount or pull waitlist clients into those gaps — just say the word.` };
  }

  // Top service
  if (/(top|popular|best|most booked) (service|treatment)/.test(q) || /top service/.test(q)) {
    const m = new Map<string, number>();
    active.forEach((a) => m.set(a.serviceId, (m.get(a.serviceId) ?? 0) + 1));
    const top = [...m.entries()].sort((a, b) => b[1] - a[1])[0];
    return { role: "assistant", text: top ? `Your most-booked service is ${serviceById(top[0])?.name} with ${top[1]} appointments this week.` : "No bookings yet this week." };
  }

  // Most-booked staff
  if (/(busiest|most booked) (staff|stylist|specialist|member)/.test(q) || /who.?s the busiest/.test(q)) {
    const m = new Map<string, number>();
    active.forEach((a) => m.set(a.staffId, (m.get(a.staffId) ?? 0) + 1));
    const top = [...m.entries()].sort((a, b) => b[1] - a[1])[0];
    return { role: "assistant", text: top ? `${salon.staffById(top[0])?.name} is your busiest specialist with ${top[1]} appointments this week.` : "No bookings yet." };
  }

  return { role: "assistant", text: "I can help with revenue, retention, quiet days, top services, and booking appointments. Try one of the suggestions below, or ask me to “book …”." };
}

function parseBooking(text: string, salon: ReturnType<typeof useSalon>): Proposal | null {
  const { state } = salon;
  const lower = text.toLowerCase();

  const service = state.services.find((s) => lower.includes(s.name.toLowerCase())) ?? state.services.find((s) => lower.includes(s.category));
  const client = state.clients.find((c) => lower.includes(c.firstName.toLowerCase()));
  const staff = state.staff.find((m) => lower.includes(m.name.split(" ")[0].toLowerCase()));
  const dayIdx = DAYS.findIndex((d) => lower.includes(d.label.toLowerCase()));

  // time like "2pm", "2 pm", "14:00", "2:30pm"
  let start: number | null = null;
  const tm = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (tm) {
    let h = parseInt(tm[1], 10);
    const min = tm[2] ? parseInt(tm[2], 10) : 0;
    const mer = tm[3];
    if (mer === "pm" && h < 12) h += 12;
    if (mer === "am" && h === 12) h = 0;
    if (!mer && h <= 8) h += 12; // assume afternoon for salon hours
    start = h + min / 60;
  }

  if (!service || !client || !staff || dayIdx < 0 || start == null) return null;
  const label = `${service.name} for ${client.firstName} ${client.lastName} with ${staff.name} · ${DAYS[dayIdx].label} ${DAYS[dayIdx].date}, ${fmtRange(start, start).split(" - ")[0]} · ${money(service.priceMinor, state.settings.currency)}`;
  return { serviceId: service.id, staffId: staff.id, clientId: client.id, day: dayIdx, start, label };
}
