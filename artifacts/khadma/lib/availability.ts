import type { Provider } from "@workspace/api-client-react";

/** Default radius (km) for the provider "nearby open requests" feed. */
export const DEFAULT_RADIUS_KM = 25;

function parseHHMM(v: string | null | undefined): number | null {
  if (!v) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(v.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

/**
 * Whether a provider is accepting work right now: the availability toggle must
 * be on, and — if a from/to schedule window is set — the current time must fall
 * inside it. Supports overnight windows (from > to). Mirrors the server check.
 */
export function isProviderAvailableNow(
  provider: Pick<Provider, "isAvailable" | "availableFrom" | "availableTo">,
  now: Date = new Date(),
): boolean {
  if (!provider.isAvailable) return false;
  const from = parseHHMM(provider.availableFrom);
  const to = parseHHMM(provider.availableTo);
  if (from === null || to === null || from === to) return true;
  const cur = now.getHours() * 60 + now.getMinutes();
  return from < to ? cur >= from && cur < to : cur >= from || cur < to;
}
