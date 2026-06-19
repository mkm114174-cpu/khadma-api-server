---
name: Khadma category→skill mapping & Expo-web icon fonts
description: Why request creation must resolve real catalog skill IDs at runtime, and which icon fonts render on Expo web.
---

# Category → skill resolution (request creation)

The home/services screens expose a fictional ~14-item category taxonomy (painting, cars, appliances, other, ...) that does NOT line up with the real catalog. The real catalog is the source of truth: skills carry a `slug` and a `category` section (`beauty` / `home` / `maintenance`), and there are far more granular skills than home categories (no `cars`/`other`/`maintenance`/single-`appliances` skill exists).

**Rule:** never hardcode skill IDs to satisfy `POST /requests` (it inserts `skillId` with a FK to `skills`). Hardcoded IDs drift across environments/re-seeds and FK-violate → request submit fails ("submitFailed"). Resolve a REAL id at runtime from the live catalog: `useListSkills({status:"approved"})`, then explicit `skillId` param → match by slug (CATEGORY_SLUG) → match by section (CATEGORY_SECTION) → first skill; block submit if unresolved.

**Why:** the original `CATEGORY_SKILLS` map used ids 5/6/7/8 (furniture/cars/ac/carpentry) which never existed in the DB.

**How to apply:** any new category tile or booking entry point must carry a real skillId or fall through this resolver. Categories with no matching real skill (cars/other) intentionally fall back to a valid id — acceptable (results in "no matching provider"), not a crash.

# Expo-web icon fonts

MaterialCommunityIcons glyphs do NOT render on this app's Expo web build (show as tofu/broken), while **Feather** and **FontAwesome (v4)** render fine. Prefer Feather/FontAwesome for any icon that must show on web. Example fixes: painting → FontAwesome `paint-brush`; grid/tab → Feather `grid`.
