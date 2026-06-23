---
name: Orval nullable fields
description: How nullability flows from OpenAPI through orval into generated TS/Zod, and the form-hydration trap for those fields.
---

# Nullable fields: OpenAPI → orval → TS/Zod

- An OpenAPI property declared `type: string` generates `field?: string` (i.e. `string | undefined`) — it does NOT accept `null`. To allow `null` in both the TS type and the Zod validator you must declare `type: ["string", "null"]` on that property.
- Read and write schemas are independent. If a field is nullable on the response model (e.g. `Provider`) you must ALSO mark it nullable on the corresponding input model (e.g. `ProviderUpdate`) or clients cannot send `null` to clear it. Keep the pair in lockstep.

**Why:** sending `field: someString || null` for a "clear this value" UX fails typecheck against a non-nullable generated input type, and silently can't clear server-side. Discovered building the Khadma provider availability schedule (clearable HH:MM times).

**How to apply:** when a field is user-clearable, make it `["<type>", "null"]` on BOTH the entity and its *Update/*Input schema, re-run `pnpm --filter @workspace/api-spec run codegen`, then send `value.trim() || null`.

# Form state hydrated from async query data

- Do NOT seed `useState` from query data that is still loading: `useState(provider?.availableFrom ?? "")` runs once while `provider` is undefined, so the server value never appears after the fetch resolves.
- Instead initialize to empty and hydrate in a `useEffect` keyed on the server fields, guarded by a `dirty` flag so an in-flight refetch never clobbers the user's active edits.
