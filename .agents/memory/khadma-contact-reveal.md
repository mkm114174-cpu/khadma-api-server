---
name: Khadma contact reveal / post-acceptance privacy
description: How phone numbers and chat are gated to post-acceptance only; where the leak paths are.
---

# Contact reveal & post-acceptance privacy

Phone numbers and customer↔provider chat must stay private until a request is
**accepted** (a provider is assigned and status is `active|in_progress|completed`).

**Rule:** the only sanctioned phone-reveal path is `GET /requests/:id/contact`
(owner → assigned provider's contact; assigned provider → customer's contact;
409 before acceptance, 403 for anyone else).

**Why:** keeps negotiation and contact exchange inside the platform until a deal
is struck, so providers can't bypass the marketplace while bidding.

**Leak paths to keep closed (these are the easy regressions):**
- `GET /providers` and `GET /providers/:id` return full provider rows — they MUST
  redact `phone: null` for non-admin/non-owner callers. Customer discovery
  screens call `useListProviders()`, so any phone in that payload is a pre-accept
  leak. Admin web legitimately reads `provider.phone`, so keep it for admins.
- `GET /chat/conversations` aggregates all chat rows — it must re-apply the
  assigned-only filter (`request.providerId === provider.id`) or legacy/pre-accept
  threads (and their last-message preview) stay visible even after chat creation
  is locked down. `resolveParticipant` covers messages send/read/list, NOT the
  conversations list — that filter is separate.

**Phone source:** providers have TWO phones — `users.phone` (account, set at
provisioning, edited via edit-profile) and `providers.phone` (onboarding). The
contact endpoint returns `providers.phone ?? users.phone` for the provider's
contact; customers only have `users.phone`.

**How to apply:** any new endpoint that returns provider/user rows to customers
must redact phone; any new chat surface must enforce assignment. The reveal is
endpoint-gated, never client-gated alone.
