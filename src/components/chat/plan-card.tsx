"use client";

import { useMemo, useState } from "react";
import { Check, Droplets, Lightbulb, Luggage, Plus, RefreshCw, ShoppingBag, Sunset, Waves, Wind } from "lucide-react";
import { CATEGORIES, imageUrl, type WardrobeItem } from "@/lib/wardrobe";
import type { OutfitPlan } from "@/lib/chat-types";
import type { WeatherReport } from "@/lib/weather";
import { cn } from "@/lib/utils";

type ItemMap = Map<string, WardrobeItem>;
type LookT = OutfitPlan["days"][number]["looks"][number];

export function PlanCard({
  plan,
  items,
  storageKey,
  onAsk,
}: {
  plan: OutfitPlan;
  items: ItemMap;
  storageKey: string;
  /** Sends a follow-up question to the stylist (e.g. "another look"); absent while a reply is running. */
  onAsk?: (question: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-card">
      <div className="px-5 pb-4 pt-5">
        <h3 className="font-display text-2xl leading-tight sm:text-3xl">{plan.title}</h3>
        {plan.weather_note && <p className="mt-1.5 text-sm text-ink2">{plan.weather_note}</p>}
        {plan.intro && <p className="mt-2 text-sm leading-relaxed text-muted">{plan.intro}</p>}
      </div>

      {plan.days?.map((day, d) => (
        <section key={d} className="border-t border-line px-5 py-5">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3">
            <h4 className="eyebrow !text-ink">{day.label}</h4>
            {day.weather && <span className="text-xs text-muted">{day.weather}</span>}
          </div>
          <div className="space-y-5">
            {day.looks?.map((look, l) => (
              <LookRow
                key={l}
                look={look}
                items={items}
                onAnother={onAsk && (() => onAsk(`Geef me een andere look voor ${day.label}, ${look.moment.toLowerCase()}${look.occasion ? ` (${look.occasion})` : ""}.`))}
              />
            ))}
          </div>
        </section>
      ))}

      {plan.packing && <Packing plan={plan} packing={plan.packing} items={items} storageKey={storageKey} />}

      {plan.gaps && plan.gaps.length > 0 && (
        <div className="border-t border-line px-5 py-5">
          <p className="eyebrow mb-2 flex items-center gap-1.5">
            <ShoppingBag className="size-3.5" /> Nog aanschaffen
          </p>
          <ul className="space-y-1.5 text-sm text-ink2">
            {plan.gaps.map((g, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-2 size-1 shrink-0 rounded-full bg-sand" />
                {g}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function LookRow({ look, items, onAnother }: { look: LookT; items: ItemMap; onAnother?: () => void }) {
  const pieces = (look.item_ids ?? []).map((id) => items.get(id)).filter((i): i is WardrobeItem => !!i);
  const missing = look.missing ?? [];
  return (
    <div>
      <div className="mb-2 flex items-baseline gap-2">
        <span className="text-sm font-semibold">{look.moment}</span>
        {look.occasion && <span className="truncate text-sm text-muted">{look.occasion}</span>}
      </div>
      <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
        {pieces.map((item) => (
          <figure key={item.id}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl(item)} alt={item.name} loading="lazy" className="aspect-square w-full rounded-xl bg-bg2 object-cover" />
            <figcaption className="mt-1 line-clamp-2 text-[11px] leading-tight text-ink2">{item.name}</figcaption>
          </figure>
        ))}
        {missing.map((name) => (
          <figure key={name}>
            <div className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line bg-bg p-2 text-center">
              <Plus className="size-4 text-muted" />
              <span className="text-[10px] leading-tight text-muted">nog niet in je kast</span>
            </div>
            <figcaption className="mt-1 line-clamp-2 text-[11px] leading-tight text-ink2">{name}</figcaption>
          </figure>
        ))}
      </div>
      {pieces.length === 0 && missing.length === 0 && <p className="text-sm text-muted">Geen stukken gevonden in je kast.</p>}
      <p className="mt-2 text-sm leading-relaxed text-ink2">{look.why}</p>
      {look.tip && (
        <p className="mt-1 flex gap-1.5 text-sm text-muted">
          <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-sand" /> {look.tip}
        </p>
      )}
      {onAnother && (
        <button onClick={onAnother} className="mt-2 flex items-center gap-1.5 text-xs font-medium text-ink2 underline-offset-4 hover:text-ink hover:underline">
          <RefreshCw className="size-3" /> Andere look
        </button>
      )}
    </div>
  );
}

function Packing({ plan, packing, items, storageKey }: { plan: OutfitPlan; packing: NonNullable<OutfitPlan["packing"]>; items: ItemMap; storageKey: string }) {
  // Plans only render client-side (after the chat is fetched), so reading
  // localStorage in the initializer can't cause a hydration mismatch.
  const [checked, setChecked] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return new Set(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      return new Set(); // private mode: just don't remember
    }
  });
  const toggle = (key: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      try {
        localStorage.setItem(storageKey, JSON.stringify([...next]));
      } catch {
        /* ignore */
      }
      return next;
    });

  // The suitcase is exactly what the looks wear. Older plans without looks
  // fall back to the list the stylist wrote itself.
  const clothes = useMemo(() => {
    const fromLooks = (plan.days ?? []).flatMap((d) => (d.looks ?? []).flatMap((l) => l.item_ids ?? []));
    const ids = [...new Set(fromLooks.length ? fromLooks : (packing.item_ids ?? []))];
    return ids.map((id) => items.get(id)).filter((i): i is WardrobeItem => !!i);
  }, [plan.days, packing.item_ids, items]);
  const groups = useMemo(() => {
    const byCategory: { label: string; items: WardrobeItem[] }[] = CATEGORIES.map((c) => ({ label: c.label, items: clothes.filter((i) => i.category === c.id) }));
    byCategory.push({ label: "Overig", items: clothes.filter((i) => !CATEGORIES.some((c) => c.id === i.category)) });
    return byCategory.filter((g) => g.items.length > 0);
  }, [clothes]);
  const total = clothes.length + (packing.essentials ?? []).reduce((n, g) => n + (g.items?.length ?? 0), 0);
  const done = [...checked].length;

  return (
    <div className="border-t border-line bg-bg/60 px-5 py-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="flex items-center gap-2 font-display text-lg">
          <Luggage className="size-4" /> In de koffer
        </p>
        {total > 0 && (
          <span className="text-xs text-muted">
            {Math.min(done, total)}/{total} ingepakt
          </span>
        )}
      </div>

      {groups.map((group) => (
        <div key={group.label} className="mb-4">
          <p className="eyebrow mb-1.5">
            {group.label} · {group.items.length}
          </p>
          <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
            {group.items.map((item) => {
              const key = `item:${item.id}`;
              const on = checked.has(key);
              return (
                <button key={item.id} onClick={() => toggle(key)} className="text-left">
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageUrl(item)} alt={item.name} loading="lazy" className={cn("aspect-square w-full rounded-xl bg-bg2 object-cover transition", on && "opacity-40")} />
                    {on && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="rounded-full bg-olive p-1 text-white">
                          <Check className="size-4" />
                        </span>
                      </span>
                    )}
                  </div>
                  <span className={cn("mt-1 line-clamp-2 text-[11px] leading-tight text-ink2", on && "line-through opacity-60")}>{item.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="grid gap-4 sm:grid-cols-2">
        {(packing.essentials ?? []).map((group) => (
          <div key={group.group}>
            <p className="eyebrow mb-1.5">{group.group}</p>
            <ul className="space-y-1">
              {(group.items ?? []).map((thing) => {
                const key = `${group.group}:${thing}`;
                const on = checked.has(key);
                return (
                  <li key={thing}>
                    <button onClick={() => toggle(key)} className="flex w-full items-start gap-2 text-left text-sm">
                      <span
                        className={cn(
                          "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border transition",
                          on ? "border-olive bg-olive text-white" : "border-muted/60 bg-card",
                        )}
                      >
                        {on && <Check className="size-3" />}
                      </span>
                      <span className={cn(on && "text-muted line-through")}>{thing}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

const ICON: [RegExp, string][] = [
  [/onweer/, "⛈️"],
  [/sneeuw/, "❄️"],
  [/regen|bui|motregen|ijzel/, "🌧️"],
  [/mist/, "🌫️"],
  [/half bewolkt/, "⛅"],
  [/bewolkt/, "☁️"],
  [/zonnig|onbewolkt/, "☀️"],
];

function icon(summary: string) {
  return ICON.find(([re]) => re.test(summary))?.[1] ?? "🌤️";
}

function dayName(iso: string) {
  return new Intl.DateTimeFormat("nl-NL", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(iso + "T12:00:00Z"));
}

export function WeatherStrip({ report }: { report: WeatherReport }) {
  return (
    <div className="rounded-3xl border border-line bg-card px-4 py-3">
      <p className="mb-2 text-xs text-muted">
        Weer in <span className="font-medium text-ink2">{report.place}</span>
        {report.region ? `, ${report.region}` : ""}
        {report.source === "last-year" && " · indicatie o.b.v. vorig jaar"}
      </p>
      <div className="scroll-x flex gap-2 overflow-x-auto">
        {report.days.map((d) => (
          <div key={d.date} className="min-w-[8.5rem] shrink-0 rounded-2xl bg-bg px-3 py-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-medium capitalize text-ink2">{dayName(d.date)}</span>
              <span className="text-lg">{icon(d.summary)}</span>
            </div>
            <p className="mt-0.5 text-base font-semibold">
              {d.maxC ?? "–"}° <span className="font-normal text-muted">/ {d.minC ?? "–"}°</span>
            </p>
            <p className="text-muted">
              {d.morningC ?? "–"}° · {d.afternoonC ?? "–"}° · {d.eveningC ?? "–"}°
            </p>
            <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-muted">
              {d.rainChancePct != null && (
                <span className="flex items-center gap-0.5">
                  <Droplets className="size-3" />
                  {d.rainChancePct}%
                </span>
              )}
              {d.windKmh != null && (
                <span className="flex items-center gap-0.5">
                  <Wind className="size-3" />
                  {d.windKmh}
                </span>
              )}
              {d.seaC != null && (
                <span className="flex items-center gap-0.5">
                  <Waves className="size-3" />
                  {d.seaC}°
                </span>
              )}
              {d.sunset && (
                <span className="flex items-center gap-0.5">
                  <Sunset className="size-3" />
                  {d.sunset}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
