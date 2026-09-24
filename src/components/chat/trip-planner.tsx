"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Minus, Plus, X } from "lucide-react";
import { imageUrl, type WardrobeItem } from "@/lib/wardrobe";
import type { TripRequest } from "@/lib/chat-types";
import { cn } from "@/lib/utils";

function isoDate(d: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam" }).format(d);
}

function tomorrow() {
  return isoDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
}

function niceDate(iso: string) {
  return new Intl.DateTimeFormat("nl-NL", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(iso + "T12:00:00Z"));
}

function list(names: string[]) {
  return names.length <= 1 ? names.join("") : `${names.slice(0, -1).join(", ")} en ${names[names.length - 1]}`;
}

/**
 * Trip builder: where, when, how many days, and which shoes. Each day gets two
 * looks (chill by day, dressed up for dinner), built around one pair of shoes.
 */
export function TripPlanner({
  items,
  onClose,
  onSubmit,
}: {
  items: WardrobeItem[];
  onClose: () => void;
  onSubmit: (message: string, trip: TripRequest) => void;
}) {
  const shoes = useMemo(() => items.filter((i) => i.category === "shoes" && !i.archived), [items]);
  const [place, setPlace] = useState("");
  const [start, setStart] = useState(tomorrow);
  const [days, setDays] = useState(3);
  const [daysTouched, setDaysTouched] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  function toggle(id: string) {
    const next = picked.includes(id) ? picked.filter((p) => p !== id) : [...picked, id];
    setPicked(next);
    // One pair per day: follow the number of shoes until the days were set by hand.
    if (!daysTouched && next.length > 0) setDays(Math.min(14, next.length));
  }

  function changeDays(delta: number) {
    setDaysTouched(true);
    setDays((d) => Math.min(14, Math.max(1, d + delta)));
  }

  function submit() {
    const names = picked.map((id) => shoes.find((s) => s.id === id)?.name).filter((n): n is string => !!n);
    const where = place.trim();
    const message =
      `${days} ${days === 1 ? "dag" : "dagen"} ${where}, vanaf ${niceDate(start)}` + (names.length ? `, met ${list(names)}.` : ".");
    onSubmit(message, { place: where, start, days, shoeIds: picked });
  }

  const ready = place.trim().length > 0 && !!start;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <div
        className="flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl bg-card shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pb-2 pt-5">
          <div>
            <p className="eyebrow">Reisplanner</p>
            <h2 className="mt-1 font-display text-2xl">Plan je outfits</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-bg2" aria-label="Sluiten">
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-4">
          <label className="block">
            <span className="eyebrow mb-1.5 block">Waarheen</span>
            <input
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder="Bijv. Porto Cervo"
              className="w-full rounded-2xl border border-line bg-bg px-4 py-3 text-[16px] outline-none focus:border-ink"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="eyebrow mb-1.5 block">Vertrek</span>
              <input
                type="date"
                value={start}
                min={isoDate(new Date())}
                onChange={(e) => setStart(e.target.value)}
                className="w-full rounded-2xl border border-line bg-bg px-4 py-3 text-[16px] outline-none focus:border-ink"
              />
            </label>
            <div>
              <span className="eyebrow mb-1.5 block">Dagen</span>
              <div className="flex items-center justify-between rounded-2xl border border-line bg-bg px-2 py-1.5">
                <button onClick={() => changeDays(-1)} className="rounded-full p-2 hover:bg-bg2" aria-label="Minder dagen">
                  <Minus className="size-4" />
                </button>
                <span className="text-[16px] font-semibold">{days}</span>
                <button onClick={() => changeDays(1)} className="rounded-full p-2 hover:bg-bg2" aria-label="Meer dagen">
                  <Plus className="size-4" />
                </button>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="eyebrow">Welke schoenen gaan mee?</span>
              {picked.length > 0 && <span className="text-xs text-muted">{picked.length} gekozen</span>}
            </div>
            {shoes.length === 0 ? (
              <p className="rounded-2xl bg-bg px-4 py-3 text-sm text-muted">
                Er staan nog geen schoenen in je kast. Voeg ze toe via Kast, of ga door: dan kies ik zelf.
              </p>
            ) : (
              <>
                <p className="mb-3 text-sm text-muted">Elk paar krijgt één dag: overdag een chill outfit, &apos;s avonds een luxe outfit voor uit eten.</p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {shoes.map((s) => {
                    const n = picked.indexOf(s.id);
                    return (
                      <button key={s.id} onClick={() => toggle(s.id)} className="text-left">
                        <div className={cn("relative overflow-hidden rounded-2xl bg-bg2 ring-2 ring-offset-2 ring-offset-card transition", n >= 0 ? "ring-ink" : "ring-transparent")}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={imageUrl(s)} alt={s.name} loading="lazy" className="aspect-square w-full object-cover" />
                          {n >= 0 && (
                            <span className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-ink text-xs font-semibold text-bg">
                              {picked.length > 1 ? n + 1 : <Check className="size-3.5" />}
                            </span>
                          )}
                        </div>
                        <span className="mt-1 line-clamp-2 block text-[11px] leading-tight text-ink2">{s.name}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="border-t border-line px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <p className="mb-2 text-center text-xs text-muted">
            {days} {days === 1 ? "dag" : "dagen"} × 2 = <strong className="text-ink">{days * 2} outfits</strong>
            {picked.length > 0 && picked.length !== days && " · schoenen worden over de dagen verdeeld"}
          </p>
          <button
            onClick={submit}
            disabled={!ready}
            className="w-full rounded-full bg-accent py-3.5 text-sm font-semibold text-accent-ink transition disabled:opacity-40"
          >
            Maak {days * 2} outfits
          </button>
        </div>
      </div>
    </div>
  );
}
