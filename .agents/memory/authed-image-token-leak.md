---
name: AuthedImage bearer-token leak guard
description: Why a bearer token must only be attached to private storage URLs on the trusted origin
---

# Never attach a bearer token based on a substring match of the URL

When fetching private object-storage images with a Clerk bearer header, gate the
header on the resolved URL's **origin**, not on whether the URL *contains*
`/api/storage/objects/`.

**Why:** a persisted `imageUrl` can be an absolute URL. A substring check like
`uri.includes("/api/storage/objects/")` matches
`https://attacker.tld/api/storage/objects/x`, leaking the session token to an
attacker-controlled host.

**How to apply:** `storageUrl()` returns absolute URLs as-is (treated as
untrusted/public). `isPrivateStorageUrl()` returns true only when the URL starts
with `https://<EXPO_PUBLIC_DOMAIN>/api/storage/objects/` (or a same-origin
relative `/api/storage/objects/` when no domain is set). AuthedImage attaches the
token only for private URLs. Same rule applies to any future authed fetch helper.
