// Types shared by the stylist (server) and the chat UI (client).
import type { WeatherReport } from "./weather";

export type Look = {
  moment: string;
  occasion?: string;
  item_ids: string[];
  /** Pieces the look needs that aren't in the wardrobe (yet). */
  missing?: string[];
  why: string;
  tip?: string;
};

export type OutfitPlan = {
  title: string;
  intro?: string;
  weather_note?: string;
  days: { label: string; weather?: string; looks: Look[] }[];
  /** item_ids is only set on older plans; the suitcase is now derived from the looks. */
  packing?: { item_ids?: string[]; essentials: { group: string; items: string[] }[] };
  gaps?: string[];
};

/** NDJSON events streamed from POST /api/chat. */
export type StylistEvent =
  | { type: "chat"; id: string; title: string }
  | { type: "status"; text: string }
  | { type: "text"; text: string }
  | { type: "reset" }
  | { type: "weather"; report: WeatherReport }
  | { type: "plan"; plan: OutfitPlan }
  | { type: "error"; message: string }
  | { type: "done" };

/** A trip built in the planner: sent next to the visible question, turned into instructions on the server. */
export type TripRequest = {
  place: string;
  /** YYYY-MM-DD */
  start: string;
  days: number;
  /** Wardrobe ids of the shoes to build the outfits around (may be empty). */
  shoeIds: string[];
};

/**
 * User text blocks starting with this tag carry instructions for the stylist
 * only (e.g. the trip planner's rules); they're kept in the history but never
 * shown as a bubble.
 */
export const HIDDEN_TAG = "<reisplanner>";

export type ViewPart =
  | { kind: "text"; text: string }
  | { kind: "weather"; report: WeatherReport }
  | { kind: "plan"; plan: OutfitPlan };

export type ViewMessage = { role: "user" | "assistant"; parts: ViewPart[] };

type RawBlock = { type: string; text?: string; name?: string; id?: string; input?: unknown; tool_use_id?: string; content?: unknown; is_error?: boolean };
type RawMessage = { role: "user" | "assistant"; content: string | RawBlock[] };

/**
 * Turn the stored Claude API history into chat bubbles. Tool results live in
 * "user" messages in the API, but belong to the assistant's bubble visually.
 */
export function buildView(history: RawMessage[]): ViewMessage[] {
  const out: ViewMessage[] = [];
  const assistant = (): ViewMessage => {
    const last = out[out.length - 1];
    if (last?.role === "assistant") return last;
    const m: ViewMessage = { role: "assistant", parts: [] };
    out.push(m);
    return m;
  };

  for (const msg of history) {
    const blocks: RawBlock[] = typeof msg.content === "string" ? [{ type: "text", text: msg.content }] : msg.content;
    if (msg.role === "user") {
      const text = blocks
        .filter((b) => b.type === "text" && !b.text?.startsWith(HIDDEN_TAG))
        .map((b) => b.text ?? "")
        .join("\n")
        .trim();
      for (const b of blocks) {
        if (b.type === "tool_result" && !b.is_error && typeof b.content === "string" && b.content.startsWith("{")) {
          try {
            const report = JSON.parse(b.content) as WeatherReport;
            if (Array.isArray(report.days)) assistant().parts.push({ kind: "weather", report });
          } catch {
            /* not a weather report */
          }
        }
      }
      if (text) out.push({ role: "user", parts: [{ kind: "text", text }] });
      continue;
    }
    for (const b of blocks) {
      if (b.type === "text" && b.text?.trim()) assistant().parts.push({ kind: "text", text: b.text });
      if (b.type === "tool_use" && b.name === "show_outfits" && b.input) assistant().parts.push({ kind: "plan", plan: b.input as OutfitPlan });
      if (b.type === "fallback") {
        // Text before a fallback block was abandoned by the declining model.
        const a = assistant();
        a.parts = a.parts.filter((p) => p.kind !== "text");
      }
    }
  }
  return out;
}
