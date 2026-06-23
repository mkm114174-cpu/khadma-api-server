---
name: Clerk Expo session activation
description: Why password/code sign-in must call setActive, or the app loops back to login
---

After any Clerk (@clerk/expo v3) `signIn.*`/`signUp.*` attempt succeeds, the created
session is NOT active until you call `setActive({ session: createdSessionId })` (or
`finalize()`). Until then `useAuth().isSignedIn` stays false.

**Why:** A password sign-in that only called `signIn.password()` (with a "no finalize
needed" comment) left the session inactive, so the AuthGate never redirected — the
provider sign-in screen appeared to loop back to login on every attempt. The working
email-code flow always called `setActive` explicitly.

**How to apply:** In every sign-in/sign-up handler, after success: if
`status === "complete" && createdSessionId` → `setActive({ session: createdSessionId })`;
else fall back to `finalize()`; else surface a visible localized error (e.g. 2FA/step-up)
instead of failing silently. Get `setActive` from `useClerk()`.
