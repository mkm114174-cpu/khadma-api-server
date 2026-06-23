---
name: Khadma map framing (web vs native parity)
description: Why the web Leaflet map must fit region bounds instead of a fixed zoom, and how default framing is set
---

The home map has two renderers: `KhadmaMap.native.tsx` (react-native-maps `MapView`, respects the `region` prop incl. `latitudeDelta`/`longitudeDelta`) and `KhadmaMap.tsx` (Leaflet in an iframe, web fallback).

**Rule:** the web Leaflet renderer must derive its view from the region's deltas via `map.fitBounds([[lat-latD/2, lng-lngD/2],[lat+latD/2, lng+lngD/2]])`, NOT a hardcoded `setView(center, ZOOM)`.

**Why:** it previously hardcoded `setView(center, 14)`, ignoring the deltas. So native and web showed completely different areas — native showed the whole intended region, web zoomed into a tiny patch around the center point. Users comparing their phone (native) to the Replit web preview saw two different maps.

**How to apply:**
- Default framing lives in `DEFAULT_REGION` in `app/(tabs)/index.tsx`. It is set to northern Israel (Haifa–Nazareth–Afula): center ~32.72,35.15, deltas ~0.85. Change deltas there to zoom the overview in/out — both renderers honor it now.
- `fitBounds` auto-handles viewport aspect ratio, so you don't need to compute a pixel-based zoom.
- Default `locationName` is Israeli (`شفاعمرو، إسرائيل`); reverse-geocode only overrides it on native after GPS grant.

**Native map style = Google dark, NOT CARTO tiles.**
**Why:** the user's reference ("beta") look — Google Maps dark with route-number shields — comes from `provider={PROVIDER_DEFAULT}` + `customMapStyle={DARK_MAP_STYLE}` on Android (PROVIDER_DEFAULT = Google there). A past change swapped that for a CARTO `<UrlTile>` overlay, which covered Google's rendering and lost the shields/look. It was reverted back to `customMapStyle`.
**How to apply:**
- All native maps share one exported `DARK_MAP_STYLE` and apply it via `customMapStyle`. Do NOT reintroduce a CARTO `UrlTile` overlay on native — it hides the Google base and the route shields.
- The route shields/Google look are Android (Google Maps) only. On iOS PROVIDER_DEFAULT = Apple Maps, which ignores `customMapStyle`.
- The web renderer is a Leaflet/CARTO fallback and CANNOT show Google's proprietary shields without a paid Google Maps JS key. So the Replit web preview will never exactly match the native screenshot — confirm native parity on a phone, not the preview pane.
