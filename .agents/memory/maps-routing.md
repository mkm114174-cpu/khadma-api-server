---
name: Maps & routing source
description: How the Khadma Expo app does maps and turn-by-turn routing without any API key, and the platform-split file convention.
---

## Routing without an API key
Routing/ETA uses the **OSRM public demo** (`router.project-osrm.org`, no key, no auth).
OSRM expects **`lng,lat;lng,lat`** order (longitude first). On any failure (non-200,
empty geometry, network) fall back to a **straight-line haversine** distance with a
**30 km/h city-average** ETA, flagged `approximate: true` so the UI can label it.

**Why:** the user wants zero external setup / no billing. OSRM demo is rate-limited and
can be slow or down — the fallback guarantees the route card still shows a sane number.
**How to apply:** keep all routing logic in `artifacts/khadma/lib/routing.ts`. If the
demo proves unreliable in production, swap to a self-hosted OSRM or a keyed provider
behind the same `fetchRoute` interface.

## Maps are platform-split (web cannot bundle react-native-maps)
react-native-maps@1.18.0 does not bundle on web. Every map is two files:
`*.native.tsx` (real `MapView`) and `*.tsx` (a **Leaflet iframe** web fallback using
dark cartocdn tiles via `srcDoc`). Reuse the shared `DARK_MAP_STYLE` exported from
`components/KhadmaMap.native.tsx` for native maps. Do not import react-native-maps from
a plain `.tsx` file or it breaks the web bundle.
