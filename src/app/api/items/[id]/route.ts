import { prisma } from "@/lib/prisma";
import { CATEGORY_IDS, itemSelect, toWardrobeItem } from "@/lib/wardrobe";

const TEXT = ["name", "subcategory", "pattern", "material", "fit", "description", "notes"] as const;

export async function PATCH(request: Request, ctx: RouteContext<"/api/items/[id]">) {
  const { id } = await ctx.params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  for (const key of TEXT) if (typeof body[key] === "string") data[key] = (body[key] as string).slice(0, 2000);
  if (typeof body.category === "string" && CATEGORY_IDS.includes(body.category as never)) data.category = body.category;
  for (const key of ["formality", "warmth"] as const) {
    if (typeof body[key] === "number") data[key] = Math.min(5, Math.max(1, Math.round(body[key] as number)));
  }
  for (const key of ["colors", "styleTags"] as const) {
    if (Array.isArray(body[key])) data[key] = (body[key] as unknown[]).map(String).map((s) => s.trim()).filter(Boolean).slice(0, 12);
  }
  if (typeof body.archived === "boolean") data.archived = body.archived;

  const row = await prisma.item.update({ where: { id }, data, select: itemSelect }).catch(() => null);
  if (!row) return Response.json({ error: "Niet gevonden" }, { status: 404 });
  return Response.json(toWardrobeItem(row));
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/items/[id]">) {
  const { id } = await ctx.params;
  await prisma.item.delete({ where: { id } }).catch(() => null);
  return new Response(null, { status: 204 });
}
