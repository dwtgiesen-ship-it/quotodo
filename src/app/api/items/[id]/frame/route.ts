import { prisma } from "@/lib/prisma";
import { locateGarment } from "@/lib/analyze";
import { frameImage } from "@/lib/framing";
import { itemSelect, toWardrobeItem } from "@/lib/wardrobe";

export const maxDuration = 60;

const MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
type MediaType = (typeof MEDIA_TYPES)[number];

// Makes the cropped product shot for a photo uploaded before framing existed.
// The Kast screen calls this once per unframed item.
export async function POST(_request: Request, ctx: RouteContext<"/api/items/[id]/frame">) {
  const { id } = await ctx.params;
  const item = await prisma.item.findUnique({ where: { id }, select: { image: true, imageType: true } });
  if (!item) return Response.json({ error: "Niet gevonden" }, { status: 404 });

  const bytes = Buffer.from(item.image);
  const mediaType = (MEDIA_TYPES.includes(item.imageType as MediaType) ? item.imageType : "image/jpeg") as MediaType;
  const box = await locateGarment(bytes.toString("base64"), mediaType).catch((err) => {
    console.error("locate failed", err);
    return null;
  });
  const display = await frameImage(bytes, box).catch((err) => {
    console.error("framing failed", err);
    return null;
  });
  // framed = true even without a display, so a photo that can't be framed isn't retried forever.
  const row = await prisma.item.update({ where: { id }, data: { display, framed: true }, select: itemSelect });
  return Response.json(toWardrobeItem(row));
}
