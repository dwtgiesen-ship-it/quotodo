import { describe, expect, it } from "vitest";
import { buildView, HIDDEN_TAG } from "./chat-types";
import { sanitizePlan, tripInstructions } from "./stylist";
import type { WardrobeItem } from "./wardrobe";

describe("buildView", () => {
  it("folds tool results into the assistant bubble and hides tool plumbing", () => {
    const weather = { place: "Monaco", country: "Monaco", region: "", timezone: "", source: "forecast", note: "", days: [] };
    const plan = { title: "Diner in Monaco", days: [] };
    const view = buildView([
      { role: "user", content: [{ type: "text", text: "Vanavond Monaco?" }] },
      { role: "assistant", content: [{ type: "thinking" }, { type: "tool_use", id: "a", name: "get_weather", input: {} }] },
      { role: "user", content: [{ type: "tool_result", tool_use_id: "a", content: JSON.stringify(weather) }] },
      { role: "assistant", content: [{ type: "tool_use", id: "b", name: "show_outfits", input: plan }] },
      { role: "user", content: [{ type: "tool_result", tool_use_id: "b", content: "Getoond aan Dani." }] },
      { role: "assistant", content: [{ type: "text", text: "Veel plezier!" }] },
    ]);
    expect(view).toHaveLength(2);
    expect(view[0]).toEqual({ role: "user", parts: [{ kind: "text", text: "Vanavond Monaco?" }] });
    expect(view[1].parts.map((p) => p.kind)).toEqual(["weather", "plan", "text"]);
  });
});

describe("sanitizePlan", () => {
  it("drops item ids that are not in the wardrobe", () => {
    const plan = sanitizePlan(
      {
        title: "Test",
        days: [{ label: "Dag 1", looks: [{ moment: "Avond", item_ids: ["real", "made-up"], why: "x" }] }],
        packing: { item_ids: ["made-up", "real"], essentials: [] },
      },
      new Set(["real"]),
    );
    expect(plan.days[0].looks[0].item_ids).toEqual(["real"]);
    expect(plan.packing?.item_ids).toEqual(["real"]);
  });

  it("keeps the pieces a look still misses, dropping blanks", () => {
    const plan = sanitizePlan(
      {
        title: "Test",
        days: [{ label: "Dag 1", looks: [{ moment: "Avond", item_ids: ["real"], missing: ["Beige linnen broek", " ", 3], why: "x" }] }],
      },
      new Set(["real"]),
    );
    expect(plan.days[0].looks[0].missing).toEqual(["Beige linnen broek"]);
  });
});

describe("trip planner", () => {
  const item = (id: string, name: string) => ({ id, name }) as unknown as WardrobeItem;
  const wardrobe = [item("s1", "Camel suède loafers"), item("s2", "Taupe sneaker"), item("s3", "Cognac H-slippers")];

  it("hides the planner instructions from the chat bubbles", () => {
    const view = buildView([
      { role: "user", content: [{ type: "text", text: "3 dagen Porto Cervo" }, { type: "text", text: `${HIDDEN_TAG}\nBestemming: Porto Cervo\n</reisplanner>` }] },
    ]);
    expect(view).toEqual([{ role: "user", parts: [{ kind: "text", text: "3 dagen Porto Cervo" }] }]);
  });

  it("asks for two looks per day around the chosen shoes, ignoring unknown ids", () => {
    const text = tripInstructions({ place: "Porto Cervo", start: "2026-09-25", days: 3, shoeIds: ["s1", "nope", "s3", "s2"] }, wardrobe);
    expect(text.startsWith(HIDDEN_TAG)).toBe(true);
    expect(text).toContain("precies 6 outfits");
    expect(text).toContain("[s1] Camel suède loafers");
    expect(text).not.toContain("nope");
    expect(text).toContain("Elk paar hoort bij één dag");
  });

  it("spreads shoes over the days when the counts differ, and works without shoes", () => {
    expect(tripInstructions({ place: "Parijs", start: "2026-10-02", days: 3, shoeIds: ["s1", "s2"] }, wardrobe)).toContain("Verdeel de schoenen");
    const none = tripInstructions({ place: "Parijs", start: "2026-10-02", days: 2, shoeIds: [] }, wardrobe);
    expect(none).toContain("precies 4 outfits");
    expect(none).not.toContain("schoenen gekozen");
  });
});

describe("sanitizePlan on a half-written card", () => {
  it("renders what is there and drops half-typed ids", () => {
    const plan = sanitizePlan({ title: "Porto", days: [{ label: "Dag 1", looks: [{ moment: "Overdag", item_ids: ["real", "rea"] }, {}] }] }, new Set(["real"]));
    expect(plan.days[0].looks[0].item_ids).toEqual(["real"]);
    expect(plan.days[0].looks[1]).toMatchObject({ moment: "", item_ids: [], why: "" });
    expect(plan.packing).toBeUndefined();
  });
});
