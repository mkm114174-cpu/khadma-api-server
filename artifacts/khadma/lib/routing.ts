export interface LatLng {
  latitude: number;
  longitude: number;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export type ManeuverKind =
  | "depart"
  | "arrive"
  | "left"
  | "right"
  | "slight-left"
  | "slight-right"
  | "sharp-left"
  | "sharp-right"
  | "straight"
  | "uturn"
  | "roundabout";

export interface RouteStep {
  /** Arabic, human-readable instruction. */
  instruction: string;
  /** Street/road name when available. */
  road: string;
  /** Distance of this step in meters. */
  distanceM: number;
  /** Normalized maneuver kind, drives the directional icon. */
  kind: ManeuverKind;
  /** Coordinate where the maneuver happens. */
  at: LatLng;
}

export interface RouteResult {
  coordinates: LatLng[];
  distanceKm: number;
  durationMin: number;
  approximate: boolean;
  steps: RouteStep[];
}

// City driving average used to estimate ETA when no routing service responds.
const CITY_KMH = 30;

function maneuverKind(type: string, modifier?: string): ManeuverKind {
  if (type === "depart") return "depart";
  if (type === "arrive") return "arrive";
  if (type === "roundabout" || type === "rotary") return "roundabout";
  switch (modifier) {
    case "left":
      return "left";
    case "right":
      return "right";
    case "slight left":
      return "slight-left";
    case "slight right":
      return "slight-right";
    case "sharp left":
      return "sharp-left";
    case "sharp right":
      return "sharp-right";
    case "uturn":
      return "uturn";
    default:
      return "straight";
  }
}

function instructionFor(kind: ManeuverKind, road: string): string {
  const on = road ? ` إلى ${road}` : "";
  switch (kind) {
    case "depart":
      return road ? `انطلق على ${road}` : "انطلق";
    case "arrive":
      return "لقد وصلت إلى وجهتك";
    case "left":
      return `انعطف يساراً${on}`;
    case "right":
      return `انعطف يميناً${on}`;
    case "slight-left":
      return `انعطف يساراً قليلاً${on}`;
    case "slight-right":
      return `انعطف يميناً قليلاً${on}`;
    case "sharp-left":
      return `انعطف يساراً بشكل حاد${on}`;
    case "sharp-right":
      return `انعطف يميناً بشكل حاد${on}`;
    case "uturn":
      return "قم بالدوران للخلف";
    case "roundabout":
      return `ادخل الدوار${on}`;
    default:
      return road ? `تابع على ${road}` : "تابع بشكل مستقيم";
  }
}

export async function fetchRoute(from: LatLng, to: LatLng): Promise<RouteResult> {
  const straightKm = haversineKm(from, to);
  const fallback: RouteResult = {
    coordinates: [from, to],
    distanceKm: straightKm,
    durationMin: Math.max(1, Math.round((straightKm / CITY_KMH) * 60)),
    approximate: true,
    steps: [],
  };

  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${from.longitude},${from.latitude};${to.longitude},${to.latitude}` +
      `?overview=full&geometries=geojson&steps=true`;
    const res = await fetch(url);
    if (!res.ok) return fallback;
    const json: any = await res.json();
    const route = json?.routes?.[0];
    const coords = route?.geometry?.coordinates;
    if (!Array.isArray(coords) || coords.length === 0) return fallback;

    const steps: RouteStep[] = [];
    const legs = Array.isArray(route?.legs) ? route.legs : [];
    for (const leg of legs) {
      const legSteps = Array.isArray(leg?.steps) ? leg.steps : [];
      for (const s of legSteps) {
        const type: string = s?.maneuver?.type ?? "";
        const modifier: string | undefined = s?.maneuver?.modifier;
        const kind = maneuverKind(type, modifier);
        const road: string = typeof s?.name === "string" ? s.name : "";
        const loc = s?.maneuver?.location;
        steps.push({
          kind,
          road,
          instruction: instructionFor(kind, road),
          distanceM: Math.round(s?.distance ?? 0),
          at: Array.isArray(loc)
            ? { latitude: loc[1], longitude: loc[0] }
            : from,
        });
      }
    }

    return {
      coordinates: coords.map((c: [number, number]) => ({
        latitude: c[1],
        longitude: c[0],
      })),
      distanceKm: route.distance / 1000,
      durationMin: Math.max(1, Math.round(route.duration / 60)),
      approximate: false,
      steps,
    };
  } catch {
    return fallback;
  }
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} م`;
  return `${km.toFixed(1)} كم`;
}

export function formatDuration(min: number): string {
  if (min < 60) return `${min} دقيقة`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} س ${m} د` : `${h} ساعة`;
}
