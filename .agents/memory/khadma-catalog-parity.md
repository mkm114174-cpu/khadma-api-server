---
name: Khadma service catalog parity
description: Why provider skill selection must mirror the customer-browsable catalog, and how it's enforced.
---

Provider service selection (registration onboarding + profile edit) and the customer
browse/request flow MUST draw from the same `artifacts/khadma/constants/serviceCatalog.ts`
(the real categories via `getServiceCategories(t)`, mapped to skill slugs via `CATEGORY_SLUG`,
plus approved custom skills). The category list grows over time — count is not fixed; the
invariant is that every category has a `CATEGORY_SLUG` entry pointing at a real seeded skill
(e.g. the generic "maintenance" tile → `home-maintenance` skill, not an orphan).

**Why:** dispatch matches a request's resolved skill id against provider skill ids
(skill-exact). If a provider can pick skills customers can't request (or vice versa),
they never match and never get offers. A `cars` category existed with no `car-services`
skill, so car requests/providers silently failed to match.

**How to apply:**
- Selection state is stored as skill SLUGS; on submit/save, resolve slugs -> ids against
  the live skills list (+ approved custom). Never hardcode skill ids (they are FKs).
- On profile edit-save, normalize selections to the current catalog (intersect with the
  picker's option slugs) so legacy granular skills that no customer can request get dropped.
- New built-in skills go in `lib/db/src/seed/skills.ts` (idempotent). `seedSkills()` runs
  unconditionally on api-server startup (`artifacts/api-server/src/index.ts`), so seeds
  reach all envs incl. prod on deploy — no manual seed step.
- Pre-existing providers who never re-open profile keep legacy skills until they edit;
  a one-time backfill is the only way to retroactively normalize them.
