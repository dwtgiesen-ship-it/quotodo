import { prisma } from "@/lib/prisma";

export async function GET() {
  const chats = await prisma.chat.findMany({
    select: { id: true, title: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });
  return Response.json(chats);
}
