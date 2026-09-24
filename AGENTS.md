# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# Kofferklaar

Personal wardrobe + AI stylist. Two screens: `/` (stylist chat) and `/kast` (wardrobe).

- **Photo → item**: `POST /api/items` → `src/lib/analyze.ts` (Claude vision, structured output). The stylist never sees photos, only the text fields — keep `catalogLine()` in `src/lib/wardrobe.ts` rich.
- **Stylist**: `src/lib/stylist.ts` runs the tool loop (`get_weather` → Open-Meteo in `src/lib/weather.ts`, `show_outfits` → rendered by `src/components/chat/plan-card.tsx`). The chat history is stored raw (Claude API messages) in `Chat.messages`; `buildView()` in `src/lib/chat-types.ts` turns it into bubbles. Keep history append-only.
- **Categories** live in one place: `CATEGORIES` in `src/lib/wardrobe.ts`.
- **Auth**: single shared password (`APP_PASSWORD`) enforced in `src/proxy.ts`.
- **Brand**: the logo mark is drawn in `src/components/app-header.tsx` (`<Logo>`), `src/app/icon.svg` and `src/app/apple-icon.tsx`. Keep all three in sync. Colors are CSS tokens in `src/app/globals.css`.
