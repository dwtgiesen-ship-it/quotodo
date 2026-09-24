// Shared wardrobe vocabulary — used by the photo analyser, the stylist prompt
// and the UI filters, so all three agree on what a "category" is.

export const CATEGORIES = [
  { id: "top", label: "Tops & shirts" },
  { id: "knit", label: "Truien & vesten" },
  { id: "bottom", label: "Broeken & rokken" },
  { id: "dress", label: "Jurken & jumpsuits" },
  { id: "outerwear", label: "Jassen & blazers" },
  { id: "suit", label: "Pakken" },
  { id: "shoes", label: "Schoenen" },
  { id: "swim", label: "Zwemkleding" },
  { id: "sport", label: "Sport" },
  { id: "loungewear", label: "Loungewear & nacht" },
  { id: "bag", label: "Tassen" },
  { id: "accessory", label: "Accessoires" },
] as const;

export type Category = (typeof CATEGORIES)[number]["id"];
export const CATEGORY_IDS = CATEGORIES.map((c) => c.id) as Category[];

export function categoryLabel(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

/** Item as sent to the browser (no image bytes — those come from /api/items/:id/image). */
export type WardrobeItem = {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  colors: string[];
  pattern: string;
  material: string;
  fit: string;
  formality: number;
  warmth: number;
  styleTags: string[];
  description: string;
  notes: string;
  archived: boolean;
  updatedAt: string;
};

/** Fields Claude fills in from a photo (and the user can edit). */
export type ItemFields = Omit<WardrobeItem, "id" | "archived" | "updatedAt" | "notes">;

export const itemSelect = {
  id: true,
  name: true,
  category: true,
  subcategory: true,
  colors: true,
  pattern: true,
  material: true,
  fit: true,
  formality: true,
  warmth: true,
  styleTags: true,
  description: true,
  notes: true,
  archived: true,
  updatedAt: true,
} as const;

export function toWardrobeItem(row: Omit<WardrobeItem, "updatedAt"> & { updatedAt: Date }): WardrobeItem {
  return { ...row, updatedAt: row.updatedAt.toISOString() };
}

export function imageUrl(item: Pick<WardrobeItem, "id" | "updatedAt">): string {
  // updatedAt busts the (long-lived) browser cache when a photo is replaced.
  return `/api/items/${item.id}/image?v=${encodeURIComponent(item.updatedAt)}`;
}

/** One compact line per item — this is how the stylist "sees" the wardrobe. */
export function catalogLine(item: WardrobeItem): string {
  const parts = [
    `[${item.id}]`,
    item.name,
    `(${item.category}${item.subcategory ? "/" + item.subcategory : ""})`,
    item.colors.length ? `kleur: ${item.colors.join(", ")}` : "",
    item.pattern ? `patroon: ${item.pattern}` : "",
    item.material ? `materiaal: ${item.material}` : "",
    item.fit ? `pasvorm: ${item.fit}` : "",
    `formeel ${item.formality}/5`,
    `warmte ${item.warmth}/5`,
    item.styleTags.length ? `stijl: ${item.styleTags.join(", ")}` : "",
    item.description,
    item.notes ? `NOTITIE VAN EIGENAAR: ${item.notes}` : "",
  ];
  return parts.filter(Boolean).join(" · ");
}
