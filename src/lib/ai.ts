import Anthropic from "@anthropic-ai/sdk";
import {
  QuoteAIResponseSchema,
  QUOTE_AI_FALLBACK,
  type QuoteAIResponse,
} from "@/lib/validations";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a business quote generator for Dutch SMEs. Extract structured quote data from client communication.

Return ONLY valid JSON matching this exact schema:
{
  "project_title": "string",
  "client_name": "string",
  "client_email": "string",
  "summary": "string",
  "scope_included": ["string"],
  "scope_excluded": ["string"],
  "timeline": "string",
  "line_items": [
    {
      "description": "string",
      "quantity": 1,
      "unit": "per stuk",
      "unit_price_cents": null,
      "vat_rate": 21
    }
  ],
  "payment_terms_days": 30,
  "notes": "string"
}

Rules:
- If pricing is mentioned, convert to cents (e.g. €150 = 15000) and set unit_price_cents
- If pricing is NOT mentioned, set unit_price_cents to null
- Respond in the same language as the input
- Return ONLY the JSON object, no markdown, no explanation`;

export async function generateQuote(
  input: string
): Promise<{ data: QuoteAIResponse; raw: string }> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `${SYSTEM_PROMPT}\n\n---\n\nClient communication:\n${input}`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    if (!text) {
      return { data: QUOTE_AI_FALLBACK, raw: "NO TEXT IN RESPONSE" };
    }

    try {
      // Strip markdown code fences if present
      const cleaned = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
      const json = JSON.parse(cleaned);
      const parsed = QuoteAIResponseSchema.safeParse(json);

      if (parsed.success) {
        return { data: parsed.data, raw: text };
      }

      return { data: QUOTE_AI_FALLBACK, raw: text };
    } catch {
      return { data: QUOTE_AI_FALLBACK, raw: text };
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return { data: QUOTE_AI_FALLBACK, raw: "API ERROR: " + errMsg };
  }
}
