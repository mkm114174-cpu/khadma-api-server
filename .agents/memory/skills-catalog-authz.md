---
name: Skills catalog propose/approve authz
description: Server-side authorization rules for the admin-managed service (skills) catalog — who may propose, review, and assign sections.
---

# Skills catalog propose/approve authz

Custom services are proposed by providers and approved by admins. Three server-side
guards must stay in place (UI constraints alone are not enough):

- **Propose (`POST /skills`) is gated by ROLE `provider`/`admin`, NOT by an existing
  provider-profile row.**
  **Why:** new providers propose skills *during onboarding*, before their provider
  profile row exists. Requiring `getProviderByUserId` would 404 the legitimate
  onboarding propose. The user's `role` is already `provider` at that point.
  **How to apply:** use `requireRole("provider","admin")`. The provider→skill link
  is created idempotently (no-op if no profile yet) and re-asserted on approval and
  on onboarding submit.

- **Non-approved list views are admin-only.** `GET /skills?status=pending|rejected|all`
  must verify `role === "admin"` inline (the route is otherwise public so customers
  can read the approved catalog). Default/`approved` stays public.

- **Section assignment is whitelisted server-side** to the fixed 13 section IDs
  (painting, plumbing, electricity, cleaning, ac, carpentry, cars, appliances,
  pest_control, furniture, landscaping, moving, other). Validate `category` in both
  POST and PATCH — the admin dropdown is not a security boundary.

**Onboarding regression to remember:** once `GET /skills` defaults to approved-only,
a freshly-proposed pending skill drops out of the onboarding list, so
`setProviderSkills` (which REPLACES all links) would wipe the auto-created link.
Fix is to track in-session created skills locally and merge their ids before submit.
