import type { Provider } from "@workspace/db";

/** Great-circle distance between two lat/lng points in kilometers. */
export function haversineKm(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const lat1 = (aLat * Math.PI) / 180;
  const lat2 = (bLat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

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
 * inside it. Supports overnight windows (from > to). Uses server local time;
 * an unset or unparseable window means "no time restriction".
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
  return from < to
    ? cur >= from && cur < to // same-day window
    : cur >= from || cur < to; // overnight window
}
