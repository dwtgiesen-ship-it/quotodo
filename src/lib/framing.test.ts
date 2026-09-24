import { describe, expect, it } from "vitest";
import { cropRegion } from "./framing";

describe("cropRegion", () => {
  it("pads the garment box and clamps it to the photo", () => {
    expect(cropRegion({ x0: 100, y0: 200, x1: 600, y1: 1000 }, 960, 1280)).toEqual({ left: 36, top: 136, width: 628, height: 928 });
    expect(cropRegion({ x0: 0, y0: 0, x1: 960, y1: 1280 }, 960, 1280)).toEqual({ left: 0, top: 0, width: 960, height: 1280 });
  });

  it("accepts corners in either order", () => {
    expect(cropRegion({ x0: 600, y0: 1000, x1: 100, y1: 200 }, 960, 1280)).toEqual(cropRegion({ x0: 100, y0: 200, x1: 600, y1: 1000 }, 960, 1280));
  });

  it("falls back to the whole photo for a missing or implausible box", () => {
    const whole = { left: 0, top: 0, width: 960, height: 1280 };
    expect(cropRegion(null, 960, 1280)).toEqual(whole);
    expect(cropRegion({ x0: 10, y0: 10, x1: 20, y1: 900 }, 960, 1280)).toEqual(whole);
  });
});
