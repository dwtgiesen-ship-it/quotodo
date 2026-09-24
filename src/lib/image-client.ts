// Browser-side photo prep: downscale to ≤1280px JPEG before upload. Keeps the
// database small, uploads fast (also on hotel wifi) and well under Claude's
// image limits.

const MAX_SIDE = 1280;

export async function prepareImage(file: File): Promise<string> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error(
      /heic|heif/i.test(file.type) || /\.hei[cf]$/i.test(file.name)
        ? "HEIC-foto's kan deze browser niet lezen. Exporteer als JPG of upload via Safari."
        : "Deze foto kan niet gelezen worden.",
    );
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff"; // transparent PNGs → white, not black
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.85);
}
