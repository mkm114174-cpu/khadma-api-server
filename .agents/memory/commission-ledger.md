---
name: Commission ledger idempotency
description: How Khadma's platform commission debt is recorded and kept double-charge-safe
---

Commission is a debt ledger: each completed job inserts one `commission` row (10% of gross = priceMax ?? priceMin); providers settle with `settlement` rows. `owed = sum(commission) - sum(settlement)`. Over `OWED_THRESHOLD` (500) the provider is blocked from accepting offers (403 code `commission_blocked`).

**Rule:** commission recording must be idempotent per request, enforced at the DB, not just in app code.

**Why:** the original read-then-insert (`select existing` then `insert`) could double-charge under concurrent/retried completion PATCHes — two writers both pass the existence check.

**How to apply:** a partial unique index (`commission_ledger_request_commission_uq` on `request_id WHERE type = 'commission'`) guarantees at most one commission per job; the completion insert uses `onConflictDoNothing({ target: requestId, where: type='commission' })`. There are also CHECK constraints: `type IN ('commission','settlement')` and `amount > 0`. If you change the recording path, keep the insert conflict-safe and don't drop these constraints. Settlement rows have null requestId (not covered by the partial index), so multiple settlements per provider are fine.
