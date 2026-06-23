---
name: Auth state machine
description: How Khadma's AuthContext derives auth status from Clerk + backend profile, and the error-classification rule.
---

# Khadma auth status machine

`AuthContext` bridges Clerk's `useAuth` plus the backend profile fetch (`/users/me`) into
a status: `loading | signedOut | needsProvision | ready | error`.

**Provisioning is explicit, not JIT.** The server's `requireUser` returns `404 "User not
provisioned"` for a signed-in Clerk user with no DB row. The mobile app collects name+role
on `complete.tsx` and calls `provisionUser`.

**Error-classification rule (important):** in `loadUser`, ONLY a `404` means
`needsProvision`. Every other failure (network, 5xx, and `401`) must set an `error` status,
NOT `needsProvision`.

**Why:** an earlier version treated any non-success (incl. 401 and transient 5xx) as
"no profile yet" and pushed users into the profile-completion screen on a flaky network —
wrong and confusing. AuthGate must early-return on `error` (and `loading`) so it never
routes during those states; the error overlay offers retry + sign-out.

**How to apply:** when adding new auth/profile fetch paths, preserve this 404-only rule and
make sure any new status is handled in AuthGate's routing effect before the `ready`
fallthrough, or signed-in-but-not-ready users get mis-routed.
