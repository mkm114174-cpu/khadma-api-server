---
name: Khadma home-map town grouping
description: Providers on the home map are grouped by town (city), not shown as individual pins
---

The home map groups providers by TOWN: one pin per town with a count badge; tapping a town pin opens a bottom-sheet listing that town's providers; tapping a provider opens the existing detail/booking card.

**City model:**
- `providers.city` (text, nullable) is the source of truth. Provider onboarding requires picking a city.
- Providers without a stored city fall back to `nearestCity(coordinate)` from `constants/cities.ts` (northern-region towns, Arabic name + lat/lng).
- Town pin coordinate: known city → its CITIES lat/lng; unknown city → average of member coords.

**Rules learned:**
- Town-sheet sync must compare the provider IDENTITY set (join member ids), NOT `providers.length` — filters (search/category) can swap members while keeping the same count, leaving a stale sheet.
- The web Leaflet renderer builds marker HTML into an iframe `srcDoc`; any provider-derived string (e.g. `town.name`) MUST be HTML-escaped before embedding (`escapeHtml` in KhadmaMap.tsx) — the API accepts arbitrary city strings, so this is an injection vector.

**How to apply:** keep `KhadmaMap` props as `towns / selectedTownId / onTownPress` for both native and web; do not revert to per-provider `providers / onMarkerPress`.
