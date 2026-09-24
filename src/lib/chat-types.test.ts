import { describe, expect, it } from "vitest";
import { buildView } from "./chat-types";
import { sanitizePlan } from "./stylist";

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
});
