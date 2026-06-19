---
name: Provider identity exposure parity
description: Any provider endpoint that joins users.name must mirror the list's approved-only/admin access policy.
---

When a public provider endpoint joins `usersTable` to expose `name` (or other identity
fields), it must enforce the same visibility rule the list uses: only `status === "approved"`
rows are public; pending/under_review/rejected applicants are owner-or-admin only.

**Why:** `GET /providers` already gates non-approved listings behind admin. `GET /providers/:id`
was public with no status check, so once it returned the joined `name` it leaked applicant
identity to anyone probing ids. Caught in code review.

**How to apply:** For each provider read endpoint returning `name`, after fetching, if
`status !== "approved"` resolve the caller (getClerkUserId → loadDbUserByClerkId) and return
404 unless `role === "admin"` or `user.id === provider.userId`.
