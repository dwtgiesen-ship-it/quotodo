"use client";

import { useMemo, useState } from "react";
import { Check, Droplets, Lightbulb, Luggage, ShoppingBag, Sunset, Waves, Wind } from "lucide-react";
import { imageUrl, type WardrobeItem } from "@/lib/wardrobe";
import type { OutfitPlan } from "@/lib/chat-types";
import type { WeatherReport } from "@/lib/weather";
import { cn } from "@/lib/utils";

type ItemMap = Map<string, WardrobeItem>;

const MOMENT_STYLE: Record<string, string> = {
  ochtend: "bg-[#f3e6c4] text-[#6b4e0e] dark:bg-[#3a3120] dark:text-[#e8cf8e]",
  middag: "bg-[#dcebf3] text-[#23506c] dark:bg-[#1c2d38] dark:text-[#a9d0e8]",
  strand: "bg-[#d6ece6] text-[#1f5b4c] dark:bg-[#1a312b] dark:text-[#9fd8c7]",
  avond: "bg-[#2b2540] text-[#e4dcff] dark:bg-[#2f2848] dark:text-[#d6cbff]",
  reis: "bg-accent-soft text-accent",
};

function momentClass(moment: string) {
  const key = Object.keys(MOMENT_STYLE).find((k) => moment.toLowerCase().includes(k));
  return key ? MOMENT_STYLE[key] : "bg-bg2 text-ink2";
}

export function PlanCard({ plan, items, storageKey }: { plan: OutfitPlan; items: ItemMap; storageKey: string }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-card">
      <div className="border-b border-line bg-bg2/60 px-5 py-4">
        <h3 className="font-display text-3xl leading-tight">{plan.title}</h3>
        {plan.weather_note && <p className="mt-1 text-sm text-ink2">{plan.weather_note}</p>}
        {plan.intro && <p className="mt-2 text-sm text-muted">{plan.intro}</p>}
      </div>

      <div className="divide-y divide-line">
        {plan.days?.map((day, d) => (
          <section key={d} className="px-5 py-5">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3">
              <h4 className="font-semibold">{day.label}</h4>
              {day.weather && <span className="text-sm text-muted">{day.weather}</span>}
            </div>
            <div className="space-y-4">
              {day.looks?.map((look, l) => (
                <LookRow key={l} look={look} items={items} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {plan.packing && <Packing packing={plan.packing} items={items} storageKey={storageKey} />}

      {plan.gaps && plan.gaps.length > 0 && (
        <div className="border-t border-line bg-accent-soft/50 px-5 py-4">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <ShoppingBag className="size-4 text-accent" /> Mist nog in je kast
          </p>
          <ul className="space-y-1 text-sm text-ink2">
            {plan.gaps.map((g, i) => (
              <li key={i}>• {g}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function LookRow({ look, items }: { look: OutfitPlan["days"][number]["looks"][number]; items: ItemMap }) {
  const pieces = (look.item_ids ?? []).map((id) => items.get(id)).filter((i): i is WardrobeItem => !!i);
  return (
    <div className="rounded-2xl border border-line bg-bg/60 p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", momentClass(look.moment))}>{look.moment}</span>
        {look.occasion && <span className="text-sm text-ink2">{look.occasion}</span>}
      </div>
      <div className="scroll-x -mx-3 flex gap-2 overflow-x-auto px-3 pb-1">
        {pieces.map((item) => (
          <figure key={item.id} className="w-24 shrink-0 sm:w-28">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl(item)} alt={item.name} loading="lazy" className="aspect-[3/4] w-full rounded-xl bg-bg2 object-cover" />
            <figcaption className="mt-1 line-clamp-2 text-[11px] leading-tight text-ink2">{item.name}</figcaption>
          </figure>
        ))}
        {pieces.length === 0 && <p className="text-sm text-muted">Geen stukken gevonden in je kast.</p>}
      </div>
      <p className="mt-2 text-sm text-ink2">{look.why}</p>
      {look.tip && (
        <p className="mt-1.5 flex gap-1.5 text-sm text-muted">
          <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-accent" /> {look.tip}
        </p>
      )}
    </div>
  );
}

function Packing({ packing, items, storageKey }: { packing: NonNullable<OutfitPlan["packing"]>; items: ItemMap; storageKey: string }) {
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

  const clothes = useMemo(
    () => (packing.item_ids ?? []).map((id) => items.get(id)).filter((i): i is WardrobeItem => !!i),
    [packing.item_ids, items],
  );
  const total = clothes.length + (packing.essentials ?? []).reduce((n, g) => n + (g.items?.length ?? 0), 0);
  const done = [...checked].length;

  return (
    <div className="border-t border-line px-5 py-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-2 font-semibold">
          <Luggage className="size-4 text-accent" /> In de koffer
        </p>
        {total > 0 && (
          <span className="text-xs text-muted">
            {Math.min(done, total)}/{total} ingepakt
          </span>
        )}
      </div>

      {clothes.length > 0 && (
        <div className="mb-4 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {clothes.map((item) => {
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
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {(packing.essentials ?? []).map((group) => (
          <div key={group.group}>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">{group.group}</p>
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
                          on ? "border-olive bg-olive text-white" : "border-line bg-card",
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
    <div className="rounded-2xl border border-line bg-card px-4 py-3">
      <p className="mb-2 text-xs text-muted">
        Weer in <span className="font-medium text-ink2">{report.place}</span>
        {report.region ? `, ${report.region}` : ""}
        {report.source === "last-year" && " · indicatie o.b.v. vorig jaar"}
      </p>
      <div className="scroll-x flex gap-2 overflow-x-auto">
        {report.days.map((d) => (
          <div key={d.date} className="min-w-[8.5rem] shrink-0 rounded-xl bg-bg2/70 px-3 py-2 text-xs">
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
