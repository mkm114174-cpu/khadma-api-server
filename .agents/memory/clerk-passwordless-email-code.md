---
name: Clerk passwordless email-code login (managed instance)
description: How to do code-based passwordless login on Replit-managed Clerk, and why phone/SMS is unavailable.
---

Replit-managed Clerk does NOT support phone/SMS sign-in (no Twilio). For a "login with a code" UX, use **email one-time codes** instead — same email-code infra Clerk already uses at sign-up, so no paid SMS.

**Why:** A customer-facing passwordless request asked for SMS codes; managed Clerk can't do phone sign-in, and the user rejected paid Twilio. Email code is the free, supported path.

**How to apply (Core v3 Future API, @clerk/expo):**
- Existing user: `signIn.emailCode.sendCode({emailAddress})` → `signIn.emailCode.verifyCode({code})` → check `signIn.status === "complete"` → `signIn.finalize({navigate})`.
- New user (fallback when sendCode returns error code `form_identifier_not_found`): `signUp.create({emailAddress})` → `signUp.verifications.sendEmailCode()` → `signUp.verifications.verifyEmailCode({code})` → check `signUp.status === "complete"` → `signUp.finalize({navigate})`.
- All these return `{ error }`. `signUp.emailCode` does NOT exist (use `signUp.verifications`). Read `*.status` right after the awaited call — the Future resource is mutated in place.
- Include a hidden `<View nativeID="clerk-captcha" />` on the screen for the sign-up bot-protection path.

**Welcome-before-entry pattern:** to show a branded screen between code entry and entering the app, defer `finalize()`. The session stays inactive (so AuthGate won't redirect) until you call finalize — render the splash after a successful `verifyCode`, then call finalize from the splash's onDone. ALWAYS handle finalize failure (revert to the code step + error) or a finalize error traps the user on the splash forever.

**Animated splash gotcha (real native crash):** do NOT put a `useNativeDriver: false` animation (e.g. a progress bar animating layout `width`) inside the same `Animated.parallel`/`sequence` as `useNativeDriver: true` animations. On web it only logs a warning, but on a real device it crashes the screen (looks fine in web screenshots, dies in Expo Go). Start the JS-driven (layout) animation with its own separate `.start()` call, outside the native-driven composite.
