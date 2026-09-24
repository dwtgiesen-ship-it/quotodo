import sharp from "sharp";

/** Garment position in pixels of the stored photo. */
export type Box = { x0: number; y0: number; x1: number; y1: number };

const SIZE = 900; // square product shot
const MARGIN = 0.08; // breathing room around the garment, relative to its longest side

/**
 * Turn a phone snapshot into a square "product shot": crop to the garment with
 * a little margin, fit it in a square and fill the sides with a blurred copy of
 * the same crop, so every tile in the app has the same shape and focus.
 * A missing or implausible box falls back to the whole photo.
 */
export async function frameImage(bytes: Uint8Array, box: Box | null): Promise<Uint8Array<ArrayBuffer>> {
  const source = sharp(bytes).rotate();
  const { width = 0, height = 0 } = await source.metadata();
  if (!width || !height) throw new Error("Onleesbare foto.");

  const region = cropRegion(box, width, height);
  const cropped = await sharp(bytes).rotate().extract(region).toBuffer();

  const background = await sharp(cropped).resize(SIZE, SIZE, { fit: "cover" }).blur(40).modulate({ brightness: 1.08, saturation: 0.8 }).toBuffer();
  const foreground = await sharp(cropped).resize(SIZE, SIZE, { fit: "inside" }).normalise({ lower: 1, upper: 99 }).toBuffer();

  const out = await sharp(background)
    .composite([{ input: foreground, gravity: "centre" }])
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();
  return new Uint8Array(out);
}

export function cropRegion(box: Box | null, width: number, height: number) {
  const whole = { left: 0, top: 0, width, height };
  if (!box) return whole;
  const x0 = Math.max(0, Math.min(box.x0, box.x1));
  const y0 = Math.max(0, Math.min(box.y0, box.y1));
  const x1 = Math.min(width, Math.max(box.x0, box.x1));
  const y1 = Math.min(height, Math.max(box.y0, box.y1));
  const w = x1 - x0;
  const h = y1 - y0;
  // A sliver can't be the garment; trust the whole photo instead.
  if (w < 32 || h < 32 || w * h < width * height * 0.01) return whole;

  const pad = Math.round(Math.max(w, h) * MARGIN);
  const left = Math.max(0, Math.round(x0 - pad));
  const top = Math.max(0, Math.round(y0 - pad));
  return {
    left,
    top,
    width: Math.min(width, Math.round(x1 + pad)) - left,
    height: Math.min(height, Math.round(y1 + pad)) - top,
  };
}
