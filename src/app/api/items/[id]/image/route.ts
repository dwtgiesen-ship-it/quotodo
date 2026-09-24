import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, ctx: RouteContext<"/api/items/[id]/image">) {
  const { id } = await ctx.params;
  const row = await prisma.item.findUnique({ where: { id }, select: { image: true, imageType: true } });
  if (!row) return new Response("Niet gevonden", { status: 404 });
  return new Response(new Uint8Array(row.image), {
    headers: {
      "Content-Type": row.imageType,
      // URLs carry ?v=<updatedAt>, so the bytes behind a URL never change.
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
