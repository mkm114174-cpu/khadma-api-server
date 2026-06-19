---
name: Khadma auth status must wait on profile fetch
description: The auth status machine must factor the backend-profile-fetch flag before emitting needsProvision, or signed-in users flash the registration screen and first login appears to fail.
---

# Khadma auth status: never emit needsProvision before the profile fetch resolves

In `AuthContext`, the `status` machine must stay `loading` while Clerk reports
signed-in but the backend `/users/me` fetch has not yet settled (a `resolved`
flag). Only emit `needsProvision` after that fetch resolves with a real 404.

**Why:** If `status` is computed purely from `user`/`loadError` (ignoring the
in-flight fetch), then the instant `isSignedIn` flips true, `user` is still null
and `loadError` false → status reads `needsProvision`. AuthGate then routes to
`/(auth)/complete` and mounts the provider registration screen, then flips to
`ready` when the fetch returns. Symptoms reported by users: "app jumps out right
after registering the email" and "second login fails the first time" (it was the
registration screen flashing on every signed-in launch / login).

**How to apply:** Keep the ordering `loading (not isLoaded / not guestResolved)
→ guest → signedOut → loading (signed in but !resolved) → ready → error →
needsProvision`. `resolved` must always become true eventually for every
signed-in case (set it in the profile-load `finally` and on signed-out
transitions) so there is no stuck-loading dead end. Also guard Clerk
`verifyEmailCode`/`finalize` calls in try/catch — an unhandled rejection there
is a plausible hard crash on a physical device (web logs won't show it).
