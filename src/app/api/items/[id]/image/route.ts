import { prisma } from "@/lib/prisma";

const headers = (contentType: string) => ({
  "Content-Type": contentType,
  // URLs carry ?v=<updatedAt>, so the bytes behind a URL never change.
  "Cache-Control": "private, max-age=31536000, immutable",
});

// Serves the cropped product shot when there is one; ?original=1 for the upload as-is.
export async function GET(request: Request, ctx: RouteContext<"/api/items/[id]/image">) {
  const { id } = await ctx.params;
  if (!new URL(request.url).searchParams.has("original")) {
    const row = await prisma.item.findUnique({ where: { id }, select: { display: true } });
    if (row?.display) return new Response(new Uint8Array(row.display), { headers: headers("image/jpeg") });
  }
  const row = await prisma.item.findUnique({ where: { id }, select: { image: true, imageType: true } });
  if (!row) return new Response("Niet gevonden", { status: 404 });
  return new Response(new Uint8Array(row.image), { headers: headers(row.imageType) });
}
