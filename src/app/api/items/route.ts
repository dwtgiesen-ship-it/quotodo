import { prisma } from "@/lib/prisma";
import { analyzePhoto } from "@/lib/analyze";
import { MissingKeyError } from "@/lib/anthropic";
import { itemSelect, toWardrobeItem } from "@/lib/wardrobe";

export const maxDuration = 60;

export async function GET() {
  const rows = await prisma.item.findMany({ select: itemSelect, orderBy: [{ category: "asc" }, { createdAt: "desc" }] });
  return Response.json(rows.map(toWardrobeItem));
}

const MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
type MediaType = (typeof MEDIA_TYPES)[number];

// Body: { image: "data:image/jpeg;base64,..." } — the browser already resized it.
export async function POST(request: Request) {
  const { image } = (await request.json().catch(() => ({}))) as { image?: string };
  const match = image?.match(/^data:(image\/[a-z]+);base64,(.+)$/);
  if (!match || !MEDIA_TYPES.includes(match[1] as MediaType)) {
    return Response.json({ error: "Stuur een JPG-, PNG- of WebP-foto." }, { status: 400 });
  }
  const [, mediaType, base64] = match;
  const bytes = Buffer.from(base64, "base64");
  if (bytes.length > 4_000_000) return Response.json({ error: "Foto is te groot." }, { status: 413 });

  try {
    const fields = await analyzePhoto(base64, mediaType as MediaType);
    const row = await prisma.item.create({
      data: { ...fields, image: bytes, imageType: mediaType },
      select: itemSelect,
    });
    return Response.json(toWardrobeItem(row));
  } catch (err) {
    const status = err instanceof MissingKeyError ? 503 : 500;
    console.error("item upload failed", err);
    return Response.json({ error: err instanceof Error ? err.message : "Analyse mislukt." }, { status });
  }
}
