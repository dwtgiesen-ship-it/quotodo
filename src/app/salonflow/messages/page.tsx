"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Mail, MessageCircle, Send, Smartphone } from "lucide-react";
import { useSalon } from "../lib/store";
import { useRole, Restricted } from "../components/role";
import type { CampaignType, Channel } from "../lib/types";

const CAMPAIGN_LABEL: Record<CampaignType, string> = {
  confirmation: "Booking confirmation",
  reminder: "Appointment reminder",
  review: "Review request",
  rebooking: "Rebooking reminder",
  birthday: "Birthday campaign",
  win_back: "Win-back campaign",
};

const channelIcon = (c: Channel) => (c === "email" ? Mail : c === "whatsapp" ? MessageCircle : Smartphone);

function triggerLabel(min: number | null): string {
  if (min == null) return "Scheduled / annual";
  if (min === 0) return "On booking";
  if (min < 0) return `${Math.abs(min) / 60}h before`;
  if (min >= 1440) return `${Math.round(min / 1440)}d after`;
  return `${min / 60}h after`;
}

export default function MessagesPage() {
  const { can } = useRole();
  const { state, clientById, toggleCampaign, sendMessage } = useSalon();
  const [tab, setTab] = useState<"automations" | "log">("automations");

  if (!can("marketing")) return <Restricted />;

  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      <div className="mb-4">
        <h1 className="font-heading text-[22px] font-semibold tracking-tight">Messages</h1>
        <p className="text-[13px] text-[#9fa5a4]">Automated SMS, email &amp; WhatsApp lifecycle campaigns</p>
      </div>

      <div className="mb-4 flex items-center gap-1 rounded-lg bg-[#f0f1f1] p-0.5 text-[13px] font-medium">
        {(["automations", "log"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-md px-4 py-1.5 capitalize ${tab === t ? "bg-white shadow-sm" : "text-[#6b7280]"}`}>{t === "log" ? "Message log" : "Automations"}</button>
        ))}
      </div>

      {tab === "automations" ? (
        <div className="space-y-2">
          {state.campaigns.map((c) => {
            const Icon = channelIcon(c.channel);
            return (
              <div key={c.id} className="rounded-xl border border-[#e6e7e7] bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Icon className="size-4 text-[#5777B0]" />
                      <span className="text-[14px] font-semibold">{CAMPAIGN_LABEL[c.type]}</span>
                      <span className="rounded-full bg-[#f0f1f1] px-2 py-0.5 text-[11px] font-medium uppercase text-[#6b7280]">{c.channel}</span>
                      <span className="text-[11px] text-[#9fa5a4]">· {triggerLabel(c.triggerOffsetMin)}</span>
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-[13px] text-[#6b7280]">{c.template}</p>
                  </div>
                  <button
                    onClick={() => { toggleCampaign(c.id, !c.active); toast.success(`${CAMPAIGN_LABEL[c.type]} ${!c.active ? "enabled" : "disabled"}`); }}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${c.active ? "bg-[#4F9A57]" : "bg-[#d6d8d8]"}`}
                  >
                    <span className={`absolute top-0.5 size-5 rounded-full bg-white transition-all ${c.active ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#e6e7e7] bg-white">
          {state.messages.length === 0 && <p className="px-4 py-6 text-center text-[13px] text-[#9fa5a4]">No messages sent yet.</p>}
          {state.messages.map((m) => {
            const client = clientById(m.clientId);
            const Icon = channelIcon(m.channel);
            return (
              <div key={m.id} className="flex items-start gap-3 border-b border-[#f0f1f1] px-4 py-3 last:border-0">
                <Icon className="mt-0.5 size-4 shrink-0 text-[#9fa5a4]" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[13px]"><span className="font-medium">{client?.firstName} {client?.lastName}</span><span className="text-[#9fa5a4]">· {m.createdAt}</span></div>
                  <p className="truncate text-[13px] text-[#6b7280]">{m.body}</p>
                </div>
                <span className={`shrink-0 text-[11px] font-medium capitalize ${m.status === "read" || m.status === "delivered" ? "text-[#4F9A57]" : "text-[#9fa5a4]"}`}>{m.status}</span>
              </div>
            );
          })}
        </div>
      )}

      <Composer
        clients={state.clients.map((c) => ({ id: c.id, name: `${c.firstName} ${c.lastName}` }))}
        onSend={(clientId, channel, body) => { sendMessage(clientId, channel, body); toast.success("Message sent (demo — not really delivered)"); }}
      />
    </div>
  );
}

function Composer({ clients, onSend }: { clients: { id: string; name: string }[]; onSend: (clientId: string, channel: Channel, body: string) => void }) {
  const [clientId, setClientId] = useState("");
  const [channel, setChannel] = useState<Channel>("sms");
  const [body, setBody] = useState("");
  return (
    <div className="mt-5 rounded-xl border border-[#e6e7e7] bg-white p-4">
      <div className="mb-2 text-[13px] font-semibold">Send a one-off message</div>
      <div className="flex flex-wrap gap-2">
        <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="rounded-lg border border-[#e6e7e7] px-3 py-2 text-[13px]"><option value="">Client…</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select value={channel} onChange={(e) => setChannel(e.target.value as Channel)} className="rounded-lg border border-[#e6e7e7] px-3 py-2 text-[13px]"><option value="sms">SMS</option><option value="email">Email</option><option value="whatsapp">WhatsApp</option></select>
        <input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message…" className="min-w-[200px] flex-1 rounded-lg border border-[#e6e7e7] px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-[#dfe1e1]" />
        <button disabled={!clientId || !body} onClick={() => { onSend(clientId, channel, body); setBody(""); }} className="flex items-center gap-1.5 rounded-lg bg-[#1f2a4d] px-3 py-2 text-[13px] font-medium text-white disabled:opacity-40"><Send className="size-4" /> Send</button>
      </div>
    </div>
  );
}
