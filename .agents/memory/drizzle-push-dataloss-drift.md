---
name: Drizzle push blocked by unrelated data-loss drift
description: When `db push` aborts on a TTY/data-loss prompt caused by drift you don't own, apply your additive change via direct SQL instead of push-force.
---

`pnpm --filter @workspace/db run push` runs non-interactively in this environment, so it errors ("Interactive prompts require a TTY") whenever drizzle detects a *data-loss* statement — even one unrelated to your change.

There is pre-existing schema↔DB drift in this repo (e.g. a pending drop of `requests.service_type`). That drift makes every `push` prompt, and `push-force` would silently execute the destructive drop.

**Rule:** never `push-force` to land an additive change — it can delete unrelated columns/data flagged by accumulated drift.

**How to apply:** for additive, nullable columns, run the column's `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...` directly (via the `executeSql` callback) after editing the Drizzle schema file. Keep the schema file as the source of truth so a future clean `push` reconciles. Resolve the unrelated drift separately before any real `push`.
