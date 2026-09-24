"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUp, History, Luggage, Plus, Shirt, Trash2, X } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { PlanCard, WeatherStrip } from "./plan-card";
import { TripPlanner } from "./trip-planner";
import type { StylistEvent, TripRequest, ViewMessage, ViewPart } from "@/lib/chat-types";
import type { WardrobeItem } from "@/lib/wardrobe";
import { cn } from "@/lib/utils";

type ChatSummary = { id: string; title: string; updatedAt: string };

const SUGGESTIONS = [
  { label: "Wat trek ik vandaag aan?", prompt: "Wat trek ik vandaag aan?" },
  { label: "Vanavond uit eten", prompt: "Ik ga vanavond uit eten. Wat trek ik aan?" },
  { label: "Weekend Parijs", prompt: "Volgend weekend 2 nachten Parijs: stad overdag, 's avonds een cocktailbar." },
];

export function ChatApp() {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [itemsLoaded, setItemsLoaded] = useState(false);
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ViewMessage[]>([]);
  const [live, setLive] = useState<ViewPart[] | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [planner, setPlanner] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const itemMap = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  const loadChats = useCallback(() => {
    fetch("/api/chats")
      .then((r) => (r.ok ? r.json() : []))
      .then(setChats)
      .catch(() => {});
  }, []);

  const openChat = useCallback(async (id: string | null) => {
    setDrawer(false);
    setError(null);
    setChatId(id);
    window.history.replaceState(null, "", id ? `/?c=${id}` : "/");
    if (!id) {
      setMessages([]);
      return;
    }
    const res = await fetch(`/api/chats/${id}`);
    if (!res.ok) {
      setMessages([]);
      setChatId(null);
      window.history.replaceState(null, "", "/");
      return;
    }
    const chat = await res.json();
    setMessages(chat.messages);
  }, []);

  useEffect(() => {
    fetch("/api/items")
      .then((r) => (r.ok ? r.json() : []))
      .then((list: WardrobeItem[]) => setItems(list))
      .catch(() => {})
      .finally(() => setItemsLoaded(true));
    loadChats();
    const c = new URLSearchParams(window.location.search).get("c");
    if (c) openChat(c);
  }, [loadChats, openChat]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, live, status]);

  async function send(text: string, trip?: TripRequest) {
    const message = text.trim();
    if (!message || busy) return;
    setPlanner(false);
    setInput("");
    setError(null);
    setBusy(true);
    setStatus("Even denken…");
    setMessages((m) => [...m, { role: "user", parts: [{ kind: "text", text: message }] }]);
    setLive([]);

    let currentId = chatId;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, message, trip }),
      });
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Fout ${res.status}`);
      }
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as StylistEvent;
          handle(event);
          if (event.type === "chat") {
            currentId = event.id;
            setChatId(event.id);
            window.history.replaceState(null, "", `/?c=${event.id}`);
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Er ging iets mis.");
    } finally {
      setBusy(false);
      setStatus(null);
      if (currentId) {
        // Re-render from the saved history so what you see is what's stored.
        const res = await fetch(`/api/chats/${currentId}`).catch(() => null);
        if (res?.ok) setMessages((await res.json()).messages);
      }
      setLive(null);
      loadChats();
    }
  }

  function handle(event: StylistEvent) {
    switch (event.type) {
      case "status":
        setStatus(event.text);
        break;
      case "text":
        setStatus(null);
        setLive((parts) => {
          const p = [...(parts ?? [])];
          const last = p[p.length - 1];
          if (last?.kind === "text") p[p.length - 1] = { kind: "text", text: last.text + event.text };
          else p.push({ kind: "text", text: event.text });
          return p;
        });
        break;
      case "reset":
        setLive((parts) => (parts ?? []).filter((p) => p.kind !== "text"));
        break;
      case "weather":
        setLive((parts) => [...(parts ?? []), { kind: "weather", report: event.report }]);
        setStatus("Outfits kiezen…");
        break;
      case "plan":
        // Partial plans replace each other as the card fills in; the final one replaces the last partial.
        setLive((parts) => {
          const p = [...(parts ?? [])];
          if (p[p.length - 1]?.kind === "plan") p[p.length - 1] = { kind: "plan", plan: event.plan };
          else p.push({ kind: "plan", plan: event.plan });
          return p;
        });
        setStatus(event.partial ? "Outfits samenstellen…" : null);
        break;
      case "error":
        setError(event.message);
        break;
    }
  }

  async function deleteChat(id: string) {
    if (!confirm("Dit gesprek verwijderen?")) return;
    await fetch(`/api/chats/${id}`, { method: "DELETE" });
    if (id === chatId) openChat(null);
    loadChats();
  }

  const empty = messages.length === 0 && !live;
  const activeItems = items.filter((i) => !i.archived).length;

  return (
    <div className="flex h-dvh flex-col">
      <AppHeader>
        <button onClick={() => setDrawer(true)} className="-ml-1 rounded-full p-2 text-ink2 hover:bg-bg2 lg:hidden" aria-label="Eerdere gesprekken">
          <History className="size-5" />
        </button>
      </AppHeader>

      {planner && <TripPlanner items={items} onClose={() => setPlanner(false)} onSubmit={(message, trip) => send(message, trip)} />}

      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1">
        {/* Sidebar: previous chats */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-72 -translate-x-full border-r border-line bg-bg px-3 pb-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] transition-transform lg:static lg:z-auto lg:translate-x-0 lg:bg-transparent lg:pt-4",
            drawer && "translate-x-0 shadow-2xl lg:shadow-none",
          )}
        >
          <div className="mb-3 flex items-center gap-2">
            <button
              onClick={() => openChat(null)}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-medium text-bg"
            >
              <Plus className="size-4" /> Nieuwe vraag
            </button>
            <button onClick={() => setDrawer(false)} className="rounded-full p-2 hover:bg-bg2 lg:hidden" aria-label="Sluiten">
              <X className="size-4" />
            </button>
          </div>
          <p className="px-2 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-muted">Eerdere reizen & vragen</p>
          <ul className="space-y-0.5 overflow-y-auto text-sm">
            {chats.map((c) => (
              <li key={c.id} className="group flex items-center">
                <button
                  onClick={() => openChat(c.id)}
                  className={cn("flex-1 truncate rounded-xl px-3 py-2 text-left hover:bg-bg2", c.id === chatId && "bg-bg2 font-medium")}
                >
                  {c.title}
                </button>
                <button
                  onClick={() => deleteChat(c.id)}
                  className="rounded-full p-1.5 text-muted opacity-0 hover:text-accent group-hover:opacity-100"
                  aria-label="Verwijderen"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
            {chats.length === 0 && <li className="px-3 py-2 text-muted">Nog niets.</li>}
          </ul>
        </aside>
        {drawer && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setDrawer(false)} />}

        {/* Conversation */}
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-4">
            <div className="mx-auto max-w-3xl py-6">
              {empty ? (
                <div className="pt-8 sm:pt-16">
                  <p className="eyebrow">Jouw stylist</p>
                  <h1 className="mt-2 font-display text-4xl leading-[1.05] sm:text-5xl">Waar ga je heen?</h1>
                  <p className="mt-3 max-w-lg text-ink2">
                    Zeg waar en wanneer. Ik check het weer, kies outfits uit je eigen kast en maak je paklijst.
                  </p>
                  {itemsLoaded && activeItems === 0 && (
                    <Link
                      href="/kast"
                      className="mt-6 flex items-center gap-3 rounded-2xl border border-accent/40 bg-accent-soft px-4 py-3 text-sm"
                    >
                      <Shirt className="size-5 shrink-0 text-accent" />
                      <span>
                        <strong>Je kast is nog leeg.</strong> Upload eerst foto&apos;s van je kleding, schoenen en accessoires — dan kan ik echte looks
                        samenstellen.
                      </span>
                    </Link>
                  )}
                  <button
                    onClick={() => setPlanner(true)}
                    className="mt-8 flex w-full items-center gap-4 rounded-3xl bg-ink px-5 py-5 text-left text-bg transition hover:opacity-90"
                  >
                    <Luggage className="size-6 shrink-0" />
                    <span className="flex-1">
                      <span className="block font-display text-lg">Plan een reis</span>
                      <span className="block text-sm opacity-70">Kies je schoenen, ik maak 2 outfits per dag</span>
                    </span>
                    <ArrowRight className="size-5 opacity-70" />
                  </button>
                  <p className="eyebrow mb-2 mt-8">Of vraag direct</p>
                  <div className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-card">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s.label}
                        onClick={() => send(s.prompt)}
                        className="flex w-full items-center justify-between px-5 py-4 text-left text-[15px] font-medium transition hover:bg-bg"
                      >
                        {s.label}
                        <ArrowRight className="size-4 text-muted" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {messages.map((m, i) => (
                    <Bubble key={i} message={m} items={itemMap} keyPrefix={`${chatId}:${i}`} onAsk={busy ? undefined : send} />
                  ))}
                  {live && <Bubble message={{ role: "assistant", parts: live }} items={itemMap} keyPrefix={`${chatId}:live`} />}
                  {status && (
                    <div className="flex items-center gap-2 text-sm text-muted">
                      <span className="flex gap-1">
                        <span className="dot size-1.5 rounded-full bg-accent" />
                        <span className="dot size-1.5 rounded-full bg-accent" />
                        <span className="dot size-1.5 rounded-full bg-accent" />
                      </span>
                      {status}
                    </div>
                  )}
                  {error && <p className="rounded-xl bg-accent-soft px-4 py-3 text-sm">{error}</p>}
                </div>
              )}
              <div ref={bottomRef} className="h-2" />
            </div>
          </div>

          {/* Composer */}
          <div className="border-t border-line bg-bg/90 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
            <form
              className="mx-auto flex max-w-3xl items-end gap-2 rounded-[1.75rem] border border-line bg-card p-1.5 pl-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] focus-within:border-ink"
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
            >
              <button
                type="button"
                onClick={() => setPlanner(true)}
                className="-ml-3 flex size-10 shrink-0 items-center justify-center rounded-full text-ink2 hover:bg-bg2"
                aria-label="Reisplanner"
                title="Reisplanner"
              >
                <Luggage className="size-5" />
              </button>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                rows={1}
                placeholder={empty ? "Bijv. 3 dagen Porto Cervo…" : "Vraag verder…"}
                className="max-h-40 flex-1 resize-none bg-transparent py-2.5 text-[16px] outline-none placeholder:text-muted"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink transition disabled:opacity-40"
                aria-label="Versturen"
              >
                <ArrowUp className="size-5" />
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

function Bubble({
  message,
  items,
  keyPrefix,
  onAsk,
}: {
  message: ViewMessage;
  items: Map<string, WardrobeItem>;
  keyPrefix: string;
  onAsk?: (question: string) => void;
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] whitespace-pre-wrap rounded-3xl rounded-br-lg bg-ink px-4 py-2.5 text-[15px] text-bg">{message.parts.map((p) => (p.kind === "text" ? p.text : "")).join("")}</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {message.parts.map((part, i) => (
        <Fragment key={i}>
          {part.kind === "text" && <RichText text={part.text} />}
          {part.kind === "weather" && <WeatherStrip report={part.report} />}
          {part.kind === "plan" && <PlanCard plan={part.plan} items={items} storageKey={`kk:packed:${keyPrefix}:${i}`} onAsk={onAsk} />}
        </Fragment>
      ))}
    </div>
  );
}

/** Minimal markdown: paragraphs, "- " bullets and **bold**. */
function RichText({ text }: { text: string }) {
  const blocks = text.trim().split(/\n{2,}/);
  return (
    <div className="space-y-2 leading-relaxed text-ink">
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        if (lines.every((l) => /^\s*[-•*]\s/.test(l))) {
          return (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {lines.map((l, j) => (
                <li key={j}>{inline(l.replace(/^\s*[-•*]\s/, ""))}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i}>
            {lines.map((l, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {inline(l.replace(/^#+\s*/, ""))}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function inline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((chunk, i) =>
    chunk.startsWith("**") && chunk.endsWith("**") ? <strong key={i}>{chunk.slice(2, -2)}</strong> : <Fragment key={i}>{chunk}</Fragment>,
  );
}
