---
name: Khadma requests DB drift (service_type)
description: The requests table has a legacy NOT NULL column not present in the Drizzle schema; it caused 500s on insert.
---

# Legacy `service_type` column on `requests`

The `requests` table in the live DB has a legacy `service_type text NOT NULL`
column that the Drizzle schema (`lib/db/src/schema/requests.ts`) does NOT
define. The app migrated to `skill_id`; the current POST /requests handler
never writes `service_type`, so inserts hit a NOT NULL violation → 500
("Failed query ... insert into requests"). Fixed by
`ALTER TABLE requests ALTER COLUMN service_type DROP NOT NULL` (non-destructive;
kept the 6 legacy rows).

**Why:** The DB has drifted from the Drizzle schema — there are columns the ORM
no longer manages. You cannot see this drift from the schema file or code; you
must inspect `information_schema.columns`.

**How to apply:** When an insert/update 500s with a "Failed query" but the
Drizzle schema looks fine, compare the live table to the schema via
`information_schema.columns` and look for extra NOT-NULL columns the code does
not set. Production DB likely has the same drift — apply the same ALTER there
before/at deploy (db push aborts on drift, so it won't auto-fix).
