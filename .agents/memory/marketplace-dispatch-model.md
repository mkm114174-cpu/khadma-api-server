---
name: Khadma dispatch / auto-reassign model
description: How requests reach providers — broadcast+offers, not direct-assign — and what "auto-reassign" means here.
---

Khadma matches requests to providers with a **broadcast + offer** model, not
direct single-provider assignment: a new request notifies every approved
provider for that service type; providers submit offers; the customer accepts an
offer, which sets request.providerId and status=active.

**Why:** "Auto-reassign if a provider doesn't accept in time" has no single
assigned provider to time out against. Implementing true direct-dispatch would
be an architecture change and risk the working offer flow.

**How to apply:** Auto-reassign is implemented pragmatically as a periodic
re-broadcast sweep (api-server) for pending, unassigned requests that have
received zero offers past a timeout — it re-notifies currently-available
approved providers and throttles repeats. Prefer extending this sweep over
converting to a direct-assign state machine unless the product explicitly
requires single-provider assignment.
