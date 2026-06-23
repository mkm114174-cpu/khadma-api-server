---
name: Khadma saved customer address
description: How the customer's saved profile location works and its clear-semantics invariant
---

Customers have ONE saved location stored on the users row: `address` (text) + `lat`/`lng`.
It auto-fills the new-request form so they don't re-enter it each order.

**Rule:** address + coords are a single unit. Clearing the address text MUST also
null out lat/lng on save, and the request form only applies saved coords when a
saved address exists.
**Why:** otherwise stale coordinates keep auto-filling/submitting requests at an old
location after the user "cleared" their address (text gone, coords lingered).
**How to apply:** any edit to the address screen (app/addresses.tsx) or the request
prefill (app/(tabs)/request.tsx) must keep coords gated on a non-empty address.

Adding a new editable profile field end-to-end: add column to lib/db/src/schema/users.ts
+ drizzle push; add it to User AND UserUpdate in lib/api-spec/openapi.yaml + run codegen.
The PATCH /users/me route persists any UserUpdate field automatically (set({...parsed.data})),
so no route change is needed.
