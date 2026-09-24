import type Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { runStylist, titleFrom } from "@/lib/stylist";
import { itemSelect, toWardrobeItem } from "@/lib/wardrobe";
import type { StylistEvent } from "@/lib/chat-types";

// A multi-day plan (weather lookup + thinking + a big outfit card) can take a minute or two.
export const maxDuration = 300;

type Msg = Anthropic.Beta.Messages.BetaMessageParam;

// Body: { chatId?: string, message: string }. Responds with NDJSON StylistEvents.
export async function POST(request: Request) {
  const { chatId, message } = (await request.json().catch(() => ({}))) as { chatId?: string; message?: string };
  const text = message?.trim();
  if (!text) return Response.json({ error: "Leeg bericht" }, { status: 400 });

  const chat = chatId
    ? await prisma.chat.findUnique({ where: { id: chatId } })
    : await prisma.chat.create({ data: { title: titleFrom(text) } });
  if (!chat) return Response.json({ error: "Gesprek niet gevonden" }, { status: 404 });

  const history = (chat.messages as unknown as Msg[]) ?? [];
  history.push({ role: "user", content: [{ type: "text", text }] });

  const rows = await prisma.item.findMany({ where: { archived: false }, select: itemSelect, orderBy: [{ category: "asc" }, { createdAt: "asc" }] });
  const items = rows.map(toWardrobeItem);

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: StylistEvent) => controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      send({ type: "chat", id: chat.id, title: chat.title });
      const before = history.length;
      try {
        for await (const event of runStylist(history, items)) send(event);
      } catch (err) {
        console.error("stylist failed", err);
        send({ type: "error", message: err instanceof Error ? err.message : "Er ging iets mis." });
        // Keep the history valid for the next turn: an assistant message with
        // tool_use must always be followed by its tool_result, so roll back
        // everything this turn added except the question itself.
        history.splice(before);
        history.push({ role: "assistant", content: [{ type: "text", text: "(Dit antwoord is mislukt — probeer het nog eens.)" }] });
      }
      await prisma.chat.update({ where: { id: chat.id }, data: { messages: history as never } });
      send({ type: "done" });
      controller.close();
    },
  });

  return new Response(body, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}
