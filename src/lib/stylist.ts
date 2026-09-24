import type Anthropic from "@anthropic-ai/sdk";
import { anthropic, MODEL } from "./anthropic";
import { getWeather } from "./weather";
import { catalogLine, type WardrobeItem } from "./wardrobe";
import { HIDDEN_TAG, type OutfitPlan, type StylistEvent, type TripRequest } from "./chat-types";

type Msg = Anthropic.Beta.Messages.BetaMessageParam;
type Tool = Anthropic.Beta.Messages.BetaTool;

const EFFORT = (process.env.KOFFERKLAAR_EFFORT as "low" | "medium" | "high" | "xhigh" | undefined) || "low";

// ── Instructions ────────────────────────────────────────────────────────────
// Kept byte-stable (no dates, no wardrobe) so it caches; the wardrobe and the
// date go in a second system block after it.
const INSTRUCTIONS = `Je bent de persoonlijke stylist én reisplanner van de eigenaar van deze kledingkast (Dani). Je werkt in de app "Kofferklaar".
Dani vraagt dingen als "morgen 3 dagen naar Porto Cervo, wat heb ik nodig?" of "ik ga vanavond uit eten in Monaco, wat trek ik aan?". Jij kiest concrete outfits uit Dani's eigen kast en maakt de paklijst.

## Werkwijze
1. Zit er een plek en/of datum in de vraag? Roep dan EERST get_weather aan (ook voor "vandaag"/"vanavond"). Reken relatieve datums ("morgen", "dit weekend", "volgende week vrijdag") om met de datum van vandaag hieronder. Aantal dagen = aantal outfitdagen; reisdag telt mee.
2. Stel outfits samen met stukken uit de kast hieronder, via hun id. Doe nooit alsof iets in de kast zit dat er niet is. Elke look moet wél compleet zijn: ontbreekt een onderdeel (bijv. er zit nog geen broek of short in de kast), zet dan in "missing" van die look wat erbij hoort, kort en concreet ("Beige linnen broek", "Navy chino-short"). Zet wat Dani echt moet kopen of nog moet toevoegen ook in "gaps".
3. Toon je advies ALTIJD met de tool show_outfits — die laat Dani de foto's zien. show_outfits is je laatste stap: daarna is je beurt voorbij. Zet de kern en eventuele aannames in "intro"; schrijf er geen losse chattekst omheen.
4. Ontbreekt er echt cruciale info (bijv. geen bestemming), vraag het dan kort. Anders: maak redelijke aannames, noem ze in de intro, en lever direct.

## Opbouw van een reisplan
- Standaard maak je per reisdag precies 2 looks (3 dagen = 6 outfits), tenzij Dani iets anders vraagt:
  - "Overdag": chill en comfortabel voor ochtend en middag. Bij ≥ 22°C een short met T-shirt, polo of overhemd; koeler een lichte broek. Gaat Dani naar strand of boot, voeg zwemkleding als extra stuk toe aan deze look.
  - "Avond": luxe, voor uit eten. Lange broek of nette pantalon, overhemd of fijn knit, de netste schoenen die bij die dag horen, riem; een laag bij < 22°C of wind.
  De reisdag telt mee als dag; maak de overdag-look dan ook reisvriendelijk.
- Elke look is compleet: bovenstuk, onderstuk (of jurk), schoenen (uit de kast of via "missing"), en waar beschikbaar riem, tas, zonnebril, horloge/sieraden. Laag voor de avond (knit, overshirt, blazer) bij < 22°C of wind.
- Denk als een capsule-garderobe: zo weinig mogelijk stuks die onderling veel combinaties geven. Hergebruik broeken, schoenen en jassen slim over dagen; wissel vooral bovenstukken.
- Richtlijn voor aantallen (bij 3 dagen): 4-6 bovenstukken, 2-3 onderstukken (short(s) voor overdag, lange broek(en) voor de avond), 1 laag voor de avond, 2-3 paar schoenen. Schaal mee met de duur, maar ga er nooit ruim overheen. Een bovenstuk mag twee keer terugkomen.
- Staat er in Dani's bericht een ${HIDDEN_TAG}-blok (uit de reisplanner in de app), volg dat dan precies: daarin staan bestemming, data en de schoenen waar je de outfits omheen bouwt.
- De koffer wordt automatisch samengesteld uit alle looks: alles wat in een look staat gaat mee, niets anders.
- "packing.essentials" = alles wat niet in de kast-foto's zit, in groepen: "Documenten" (paspoort/ID, rijbewijs, boardingpass, verzekeringspas), "Geld" (pinpas, creditcard, wat contant in de lokale valuta), "Elektronica" (telefoonoplader, powerbank, oordopjes, stekkeradapter als het land een ander stopcontact heeft), "Verzorging" (toilettas, SPF, aftersun, medicijnen, deo, parfum), "Basics" (ondergoed en sokken/no-show sokken met aantallen, pyjama), "Overig" (zonnebril, sleutels, strandlaken, opvouwbare tas…). Pas aan op bestemming, weer en duur.
- Voor één moment ("vanavond", "morgen naar kantoor"): één dag met 1 hoofdlook en hooguit 1 alternatief; "packing" = wat mee in de tas/zakken (telefoon, portemonnee, sleutels, lipbalsem…), zonder kaststukken tenzij een extra laag.

## Moderegels van nu (2025-2026)
- Relaxed tailoring & quiet luxury: rustige, hoogwaardige materialen (linnen, katoen-zijde, fijne wol, suède), weinig logo's, iets ruimere pantalons en shirts, maar altijd bewust en verzorgd.
- Mediterraan / Riviera-stijl: linnen overhemden (open kraag of cubaanse kraag), gebreide polo's, getailleerde shorts net boven de knie, loafers of suède mocassins zonder zichtbare sokken, espadrilles, leren sandalen. Palet: ecru, zand, wit, navy, olijf, bruin/cognac, terracotta, zachte pastels.
- Tonal dressing en ton-sur-ton zijn sterk; houd een look op max. 3 kleuren (neutralen tellen licht), met hooguit één accent. Leer afstemmen (riem ≈ schoenen ≈ horlogeband) blijft de chique keuze voor de avond.
- Sneakers: strak en schoon (wit/leer/suède) kan overdag en bij smart casual, niet voor fine dining. Geen sportsokken bij sandalen of loafers.
- Pasvorm gaat boven trend: shorts niet flodderig of te lang, broeklengte zonder plooi op de schoen (licht cropped bij loafers), shirts niet te strak.
- Dresscodes: Monaco (restaurants, Casino de Monte-Carlo): elegant, lange broek of nette jurk, overhemd of fijn knit, jasje aanbevolen; casino = geen shorts, slippers of sportkleding. Porto Cervo / Costa Smeralda: resort-chic, ook 's avonds verzorgd (linnen pak/pantalon + overhemd, of een lichte jurk). Italiaanse kerken: schouders en knieën bedekt. Beachclubs: stijlvolle zwemkleding + cover-up.
- Praktisch: kinderkopjes → geen dunne hakken/zolen; boot → witte of lichte zolen, geen hakken; lange reisdag → kreukarm en comfortabel.
- Leid uit de kast af of Dani herenkleding, damesmode of beide draagt; ga daar niet anders mee om dan de kast doet.

## Toon
Nederlands, warm, zeker van je zaak, kort. Zoals een goede vriend(in) met smaak die ook aan de oplader denkt. Geen lange lappen tekst.`;

function contextBlock(items: WardrobeItem[], now: Date): string {
  const date = new Intl.DateTimeFormat("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Amsterdam",
  }).format(now);
  const iso = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam" }).format(now);
  const time = new Intl.DateTimeFormat("nl-NL", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" }).format(now);

  const wardrobe = items.length
    ? items.map(catalogLine).join("\n")
    : "(De kast is nog leeg. Geef algemeen advies en vraag Dani om eerst foto's te uploaden via het tabblad Kast. Roep show_outfits dan NIET aan.)";

  return `## Vandaag
${date} (${iso}), ${time} uur Nederlandse tijd. Dani woont in Nederland.

## De kast (${items.length} stuks) — formaat: [id] naam (categorie) · eigenschappen
${wardrobe}`;
}

// ── Tools ───────────────────────────────────────────────────────────────────
const TOOLS: Tool[] = [
  {
    name: "get_weather",
    description:
      "Haalt het weer op voor een plaats en periode: per dag min/max, temperatuur 's ochtends (08u), 's middags (14u) en 's avonds (21u), regenkans, wind, UV, zeewatertemperatuur en zonsondergang. Verder dan 16 dagen vooruit krijg je het weer van dezelfde data vorig jaar als klimaatindicatie.",
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["place", "start_date", "end_date"],
      properties: {
        place: { type: "string", description: "Alleen de plaatsnaam, bijv. 'Porto Cervo' of 'Monaco' (geen regio erachter)." },
        country_code: { type: "string", description: "Optioneel ISO-landcode, bijv. 'IT', 'MC', 'FR' — helpt bij dubbele plaatsnamen." },
        start_date: { type: "string", description: "YYYY-MM-DD" },
        end_date: { type: "string", description: "YYYY-MM-DD (gelijk aan start_date voor één dag)" },
      },
    },
  },
  {
    name: "show_outfits",
    description:
      "Toont Dani het outfitplan als visuele kaart met de foto's uit de kast, plus de paklijst. Gebruik dit voor elk concreet kledingadvies.",
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["title", "days"],
      properties: {
        title: { type: "string", description: "Bijv. 'Porto Cervo · 3 dagen' of 'Diner in Monaco'." },
        intro: { type: "string", description: "1-2 zinnen: de stijlrichting en eventuele aannames." },
        weather_note: { type: "string", description: "Korte weersamenvatting, bijv. '24-26°C, zonnig, avonden 22°C met wind uit zee'." },
        days: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["label", "looks"],
            properties: {
              label: { type: "string", description: "Bijv. 'Vrijdag 25 sep · aankomst'." },
              weather: { type: "string", description: "Bijv. '☀️ 26° / 22° · 10% regen'." },
              looks: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["moment", "item_ids", "why"],
                  properties: {
                    moment: { type: "string", description: "Ochtend, Middag, Avond, Strand, Reis, Hele dag…" },
                    occasion: { type: "string", description: "Wat Dani dan doet, bijv. 'Diner bij de haven'." },
                    item_ids: { type: "array", items: { type: "string" }, description: "Ids uit de kast, van boven naar beneden: bovenstuk, onderstuk, schoenen, accessoires." },
                    missing: {
                      type: "array",
                      items: { type: "string" },
                      description: "Onderdelen die deze look compleet maken maar niet in de kast zitten, bijv. 'Beige linnen broek'. Leeg als alles in de kast zit.",
                    },
                    why: { type: "string", description: "Waarom dit werkt (kleur, weer, dresscode) — 1-2 zinnen." },
                    tip: { type: "string", description: "Optionele stylingtip: mouwen oprollen, overhemd half ingestopt, geen sokken…" },
                  },
                },
              },
            },
          },
        },
        packing: {
          type: "object",
          additionalProperties: false,
          required: ["essentials"],
          properties: {
            essentials: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["group", "items"],
                properties: {
                  group: { type: "string" },
                  items: { type: "array", items: { type: "string" } },
                },
              },
            },
          },
        },
        gaps: { type: "array", items: { type: "string" }, description: "Wat ontbreekt in de kast voor deze gelegenheid, met koopadvies." },
      },
    },
  },
];

const TOOL_LABELS: Record<string, (input: Record<string, unknown>) => string> = {
  get_weather: (i) => `Weer checken in ${String(i.place ?? "…")}`,
  show_outfits: () => "Outfits samenstellen",
};

async function runTool(name: string, input: Record<string, unknown>, validIds: Set<string>): Promise<{ content: string; isError?: boolean; plan?: OutfitPlan }> {
  if (name === "get_weather") {
    try {
      const report = await getWeather({
        place: String(input.place ?? ""),
        countryCode: input.country_code ? String(input.country_code) : undefined,
        startDate: String(input.start_date ?? ""),
        endDate: String(input.end_date ?? input.start_date ?? ""),
      });
      return { content: JSON.stringify(report) };
    } catch (err) {
      return { content: err instanceof Error ? err.message : "Weer ophalen mislukt.", isError: true };
    }
  }
  if (name === "show_outfits") {
    const plan = sanitizePlan(input, validIds);
    const unknown = collectIds(input).filter((id) => !validIds.has(id));
    return {
      plan,
      content: unknown.length
        ? `Getoond, maar deze ids bestaan niet in de kast en zijn weggelaten: ${unknown.join(", ")}. Noem ze niet als kaststuk.`
        : "Getoond aan Dani.",
    };
  }
  return { content: `Onbekende tool ${name}`, isError: true };
}

function collectIds(input: Record<string, unknown>): string[] {
  const plan = input as Partial<OutfitPlan>;
  const ids = [
    ...(plan.days ?? []).flatMap((d) => (d.looks ?? []).flatMap((l) => l.item_ids ?? [])),
    ...(plan.packing?.item_ids ?? []),
  ];
  return [...new Set(ids)];
}

/** Drop ids the model invented, so the UI never shows a broken card. */
export function sanitizePlan(input: Record<string, unknown>, validIds: Set<string>): OutfitPlan {
  const plan = input as unknown as OutfitPlan;
  const keep = (ids: unknown) => (Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string" && validIds.has(id)) : []);
  return {
    title: String(plan.title ?? "Outfitplan"),
    intro: plan.intro,
    weather_note: plan.weather_note,
    days: (Array.isArray(plan.days) ? plan.days : []).map((d) => ({
      label: String(d.label ?? ""),
      weather: d.weather,
      looks: (Array.isArray(d.looks) ? d.looks : []).map((l) => ({
        moment: String(l.moment ?? ""),
        occasion: l.occasion,
        item_ids: keep(l.item_ids),
        missing: Array.isArray(l.missing) ? l.missing.filter((m): m is string => typeof m === "string" && m.trim() !== "") : undefined,
        why: String(l.why ?? ""),
        tip: l.tip,
      })),
    })),
    packing: plan.packing
      ? {
          item_ids: keep(plan.packing.item_ids ?? []),
          essentials: Array.isArray(plan.packing.essentials) ? plan.packing.essentials : [],
        }
      : undefined,
    gaps: Array.isArray(plan.gaps) ? plan.gaps : undefined,
  };
}

// ── The loop ────────────────────────────────────────────────────────────────
/**
 * Runs one stylist turn: streams text, executes tools, loops until Claude is
 * done. `history` is mutated in place (append-only) so the caller can persist it.
 */
export async function* runStylist(history: Msg[], items: WardrobeItem[]): AsyncGenerator<StylistEvent> {
  const client = anthropic();
  const validIds = new Set(items.map((i) => i.id));
  const system: Anthropic.Beta.Messages.BetaTextBlockParam[] = [
    { type: "text", text: INSTRUCTIONS },
    { type: "text", text: contextBlock(items, new Date()), cache_control: { type: "ephemeral" } },
  ];

  for (let step = 0; step < 8; step++) {
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: 32000,
      thinking: { type: "adaptive" },
      output_config: { effort: EFFORT },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      cache_control: { type: "ephemeral" },
      system,
      tools: TOOLS,
      messages: history,
    });

    for await (const event of stream) {
      if (event.type === "content_block_start" && event.content_block.type === "tool_use") {
        yield { type: "status", text: event.content_block.name === "show_outfits" ? "Outfits samenstellen…" : "Even kijken…" };
      } else if (event.type === "content_block_start" && event.content_block.type === "fallback") {
        // A fallback model continues the answer; drop the partial text the client already showed.
        yield { type: "reset" };
      } else if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        yield { type: "text", text: event.delta.text };
      }
    }

    const message = await stream.finalMessage();
    history.push({ role: "assistant", content: message.content as Msg["content"] });

    if (message.stop_reason === "refusal") {
      yield { type: "text", text: "\n\nDaar kan ik je helaas niet mee helpen." };
      return;
    }
    if (message.stop_reason === "pause_turn") continue;

    const toolUses = message.content.filter((b): b is Anthropic.Beta.Messages.BetaToolUseBlock => b.type === "tool_use");
    if (message.stop_reason !== "tool_use" || toolUses.length === 0) return;

    const results: Anthropic.Beta.Messages.BetaToolResultBlockParam[] = [];
    let shown = false;
    for (const use of toolUses) {
      const input = (use.input ?? {}) as Record<string, unknown>;
      yield { type: "status", text: (TOOL_LABELS[use.name]?.(input) ?? use.name) + "…" };
      const result = await runTool(use.name, input, validIds);
      if (use.name === "get_weather" && !result.isError) yield { type: "weather", report: JSON.parse(result.content) };
      if (result.plan) {
        shown = true;
        yield { type: "plan", plan: result.plan };
      }
      results.push({ type: "tool_result", tool_use_id: use.id, content: result.content, is_error: result.isError });
    }
    history.push({ role: "user", content: results });
    // The outfit card is the answer. Skipping the model's closing remark saves a
    // whole round trip; the tool result stays in the history, so the next
    // question simply follows it.
    if (shown) return;
  }
}

/**
 * The hidden instructions that go with a trip from the planner. Built on the
 * server from validated ids, so the model sees exact shoe ids and names.
 */
export function tripInstructions(trip: TripRequest, items: WardrobeItem[]): string {
  const shoes = trip.shoeIds.map((id) => items.find((i) => i.id === id)).filter((i): i is WardrobeItem => !!i);
  const days = Math.min(14, Math.max(1, Math.round(trip.days)));
  const lines = [
    HIDDEN_TAG,
    `Bestemming: ${trip.place.trim().slice(0, 80)}`,
    `Eerste dag: ${trip.start}, aantal dagen: ${days} (roep get_weather aan voor deze plek en periode)`,
    `Maak precies ${days * 2} outfits: per dag één "Overdag"-look (chill) en één "Avond"-look (luxe, uit eten).`,
  ];
  if (shoes.length) {
    lines.push(
      `Dani heeft deze ${shoes.length} paar schoenen gekozen. Gebruik alleen deze schoenen, geen andere:`,
      ...shoes.map((s) => `- [${s.id}] ${s.name}`),
      shoes.length === days
        ? "Elk paar hoort bij één dag en wordt die dag in beide looks gedragen (overdag én avond). Bouw beide looks rond die schoen; kies de volgorde van de dagen zelf (bijv. het comfortabelste paar op de reisdag)."
        : `Verdeel de schoenen zo eerlijk mogelijk over de dagen: elke dag krijgt één paar dat die dag in beide looks gedragen wordt, en elk paar komt minstens één dag aan de beurt.`,
    );
  }
  lines.push("</reisplanner>");
  return lines.join("\n");
}

/** A short chat title from the first question. */
export function titleFrom(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > 48 ? clean.slice(0, 46).trimEnd() + "…" : clean || "Nieuw gesprek";
}
