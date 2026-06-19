---
name: Marketplace read access control
description: Who may read requests/offers across the Khadma API, and why the firehose is gated
---

`GET /requests`, `GET /offers`, and `GET /requests/:id/offers` must scope non-admin callers server-side — never trust query params alone for authorization.

**Why:** these endpoints back the admin oversight dashboard. They were originally `requireUser`-only, so any signed-in customer/provider could omit filters and read marketplace-wide requests/offers (customer PII, all offers). That is broken access control.

**How to apply:**
- Admins: full visibility, query params are optional filters.
- Non-admins on `GET /requests`: `providerId` must equal the caller's own provider id (my jobs); `status=pending` is the provider discovery/broadcast pool (providers only); otherwise scoped to `userId = self`. Providers seeing the pending pool is intentional — they need request details to make offers.
- Non-admins on `GET /offers`: only `mine=true` (own offers) or `requestId` of a request they own; otherwise 403. No unscoped firehose.
- `GET /requests/:id/offers`: request owner or admin only (providers use `/offers?mine=true`).
- `GET /requests/:id` (single detail): same scoping as the list — owner or admin always; a provider only when assigned to it, or when it is still `pending` and matches one of their skills (discovery). Don't forget the *detail* endpoint when hardening a list endpoint — it's an easy IDOR to miss.
- Client consequence: the customer providers/ranking screen counts bookings with `useListRequests({ mine: true })`, not the global feed.
