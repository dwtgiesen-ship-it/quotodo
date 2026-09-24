import { prisma } from "@/lib/prisma";
import { buildView } from "@/lib/chat-types";

export async function GET(_request: Request, ctx: RouteContext<"/api/chats/[id]">) {
  const { id } = await ctx.params;
  const chat = await prisma.chat.findUnique({ where: { id } });
  if (!chat) return Response.json({ error: "Niet gevonden" }, { status: 404 });
  return Response.json({ id: chat.id, title: chat.title, messages: buildView(chat.messages as never) });
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/chats/[id]">) {
  const { id } = await ctx.params;
  await prisma.chat.delete({ where: { id } }).catch(() => null);
  return new Response(null, { status: 204 });
}
