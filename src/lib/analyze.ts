import { anthropic, MODEL } from "./anthropic";
import { CATEGORIES, CATEGORY_IDS, type ItemFields } from "./wardrobe";
import type { Box } from "./framing";

type MediaType = "image/jpeg" | "image/png" | "image/webp";

// Where the garment sits in the photo, in pixels of the image as sent (the
// model's coordinates map 1:1 to pixels at our ≤1280px size).
const BOX_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["x0", "y0", "x1", "y1"],
  description: "Kader in pixels rond het gekozen kledingstuk (links-boven x0,y0; rechts-onder x1,y1), zo strak mogelijk maar met het hele stuk erin. Handen, hangers en andere spullen niet meerekenen.",
  properties: {
    x0: { type: "integer" },
    y0: { type: "integer" },
    x1: { type: "integer" },
    y1: { type: "integer" },
  },
} as const;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "name",
    "category",
    "subcategory",
    "colors",
    "pattern",
    "material",
    "fit",
    "formality",
    "warmth",
    "styleTags",
    "description",
    "box",
  ],
  properties: {
    box: BOX_SCHEMA,
    name: { type: "string", description: "Korte Nederlandse naam, bijv. 'Wit linnen overhemd' of 'Bruine suède loafers'." },
    category: {
      type: "string",
      enum: CATEGORY_IDS,
      description:
        `Kies op basis van het soort kledingstuk, niet de stof: ${CATEGORIES.map((c) => `${c.id} = ${c.label}`).join(", ")}. ` +
        "T-shirts, tanktops, polo's, blouses en overhemden zijn altijd 'top', ook als ze van tricot of jersey zijn. " +
        "'knit' alleen voor echte truien, sweaters, cardigans en vesten.",
    },
    subcategory: { type: "string", description: "Bijv. polo, chino, sneaker, loafer, bermuda, blazer, riem, zonnebril." },
    colors: { type: "array", items: { type: "string" }, description: "Hoofdkleur eerst, in het Nederlands, zo precies mogelijk (ecru, navy, cognac, salie…)." },
    pattern: { type: "string", description: "effen, streep, ruit, print… " },
    material: { type: "string", description: "Beste inschatting: linnen, katoen, wol, suède, leer, denim…" },
    fit: { type: "string", description: "slim, regular, relaxed, oversized, wide leg… (leeg als niet te zien)" },
    formality: { type: "integer", description: "1 = sport/strand, 2 = casual, 3 = smart casual, 4 = business/cocktail, 5 = black tie/gala" },
    warmth: { type: "integer", description: "1 = ideaal bij 28°C+, 2 = zomer, 3 = tussenseizoen, 4 = koud, 5 = winter" },
    styleTags: { type: "array", items: { type: "string" }, description: "3-6 stijlwoorden, bijv. riviera, quiet luxury, minimal, streetwear, preppy, resort." },
    description: {
      type: "string",
      description:
        "1-2 zinnen voor een stylist die de foto NIET kan zien: silhouet, details (kraag, knopen, zool, wassing), en waar het goed bij past.",
    },
  },
} as const;

const PROMPT = `Je bent een modestylist die een digitale kledingkast catalogiseert.
Beschrijf het belangrijkste kledingstuk (of paar schoenen / accessoire) op deze foto.
Staan er meerdere stukken op, kies dan het stuk dat het meest centraal of het grootst in beeld is.
Wees concreet en eerlijk over kleur en materiaal — een andere stylist moet op basis van jouw tekst outfits kunnen samenstellen zonder de foto te zien.`;

export async function analyzePhoto(base64Jpeg: string, mediaType: MediaType): Promise<{ fields: ItemFields; box: Box }> {
  const response = await anthropic().messages.create({
    model: MODEL,
    max_tokens: 4000,
    output_config: {
      effort: "low",
      format: { type: "json_schema", schema: SCHEMA as unknown as Record<string, unknown> },
    },
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: base64Jpeg } },
          { type: "text", text: PROMPT },
        ],
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("Claude kon deze foto niet beoordelen. Probeer een andere foto.");
  }
  const text = response.content.find((b) => b.type === "text")?.text;
  if (!text) throw new Error("Geen analyse ontvangen.");
  const { box, ...parsed } = JSON.parse(text) as ItemFields & { box: Box };
  return {
    box,
    fields: {
      ...parsed,
      category: CATEGORY_IDS.includes(parsed.category as never) ? parsed.category : "accessory",
      formality: clamp(parsed.formality),
      warmth: clamp(parsed.warmth),
    },
  };
}

/** Just the garment's position — for photos uploaded before framing existed. */
export async function locateGarment(base64Jpeg: string, mediaType: MediaType): Promise<Box> {
  const response = await anthropic().messages.create({
    model: MODEL,
    max_tokens: 2000,
    output_config: {
      effort: "low",
      format: { type: "json_schema", schema: BOX_SCHEMA as unknown as Record<string, unknown> },
    },
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: base64Jpeg } },
          {
            type: "text",
            text: "Waar staat het belangrijkste kledingstuk (of paar schoenen / accessoire) op deze foto? Staan er meerdere, kies het stuk dat het meest centraal of het grootst in beeld is.",
          },
        ],
      },
    ],
  });
  if (response.stop_reason === "refusal") throw new Error("Claude kon deze foto niet beoordelen.");
  const text = response.content.find((b) => b.type === "text")?.text;
  if (!text) throw new Error("Geen kader ontvangen.");
  return JSON.parse(text) as Box;
}

function clamp(n: number): number {
  return Math.min(5, Math.max(1, Math.round(Number(n) || 3)));
}
