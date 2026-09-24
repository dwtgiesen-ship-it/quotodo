import Anthropic from "@anthropic-ai/sdk";

// One model for both jobs (photo analysis + styling). Override with
// KOFFERKLAAR_MODEL if you want to trade quality for cost.
export const MODEL = process.env.KOFFERKLAAR_MODEL || "claude-opus-5";

let client: Anthropic | null = null;

export function anthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new MissingKeyError();
  }
  client ??= new Anthropic();
  return client;
}

export class MissingKeyError extends Error {
  constructor() {
    super("ANTHROPIC_API_KEY ontbreekt — zet hem in .env (lokaal) of in Vercel → Settings → Environment Variables.");
  }
}
