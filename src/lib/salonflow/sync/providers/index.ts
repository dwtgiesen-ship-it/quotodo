import type { CalendarProvider, ProviderId } from "../types";
import { GoogleProvider } from "./google";
import { MicrosoftProvider } from "./microsoft";
import { AppleProvider } from "./apple";
import { mockProvider } from "./mock";

/** Whether real credentials are configured for a provider. */
export function isProviderLive(p: ProviderId): boolean {
  switch (p) {
    case "google": return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    case "microsoft": return !!(process.env.MS_CLIENT_ID && process.env.MS_CLIENT_SECRET);
    case "apple": return !!process.env.APPLE_CALDAV_URL && !!process.env.APPLE_LIVE;
  }
}

/**
 * Returns the live adapter when its credentials are present, otherwise the mock
 * provider so the full pipeline runs in the demo. Swapping in production is just
 * setting the provider's env vars — no engine/route/UI change.
 */
export function getProvider(p: ProviderId): CalendarProvider {
  if (!isProviderLive(p)) return mockProvider;
  switch (p) {
    case "google": return new GoogleProvider();
    case "microsoft": return new MicrosoftProvider();
    case "apple": return new AppleProvider();
  }
}

export const ALL_PROVIDERS: ProviderId[] = ["google", "microsoft", "apple"];
