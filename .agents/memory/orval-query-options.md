---
name: Orval generated query hooks — custom query options need queryKey
description: When passing a custom `query` options object to generated useGet*/useList* hooks, TS requires queryKey
---

# Orval generated React Query hooks: custom `query` options require `queryKey`

When you pass a custom `query` options object to a generated hook (e.g. to set
`enabled`), TypeScript errors with TS2741 "Property 'queryKey' is missing" unless
you also include the generated key.

**Rule:** include the matching `get*QueryKey(...)` alongside any custom query options:

```ts
useGetRequest(id, { query: { enabled: ok, queryKey: getGetRequestQueryKey(id) } });
useListRequestOffers(id, { query: { enabled: ok, queryKey: getListRequestOffersQueryKey(id) } });
```

**Why:** the generated hook's options type is the full `UseQueryOptions`, which
makes `queryKey` required once you supply a `query` object; the hook only
auto-fills the key when you pass no options.

**How to apply:** any Khadma / @workspace/api-client-react `useGet*`/`useList*`
call that needs `enabled` or other query opts must also pass the generated key.
Import the key fns from `@workspace/api-client-react`.
