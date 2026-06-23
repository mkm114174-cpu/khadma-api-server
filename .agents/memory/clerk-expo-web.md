---
name: Clerk Expo on web
description: Why @clerk/expo crashes under react-native-web and the Metro resolver workaround that fixes it.
---

# @clerk/expo crashes on web

`@clerk/expo` (seen on 3.4.2) crashes when bundled for `react-native-web`.

**Root cause:** its internal code does `require('../specs/NativeClerkModule.js')` with an
explicit `.js` extension. The explicit extension defeats Metro's platform-specific
resolution (`.web.js` / `.native.js`), so the *native* TurboModule spec is loaded on web.
That spec calls `TurboModuleRegistry.get(...)` at module-eval time, which is `undefined`
under react-native-web → uncaught crash, blank screen.

**Fix (do NOT alias the whole package):** add a `resolveRequest` hook in
`artifacts/khadma/metro.config.js` that, only when `platform === "web"`, redirects the
specific `.../specs/NativeClerkModule.js` request to the package's shipped web stub
`NativeClerkModule.web.js` (which exports `null`). Native bundles are untouched.

**Why not alias `@clerk/expo` → `@clerk/expo/web`:** the `/web` entry only exports UI
components + `ClerkLoaded`/`ClerkLoading`, NOT `ClerkProvider` or the hooks. So a
whole-package alias breaks the app. Keep the narrow per-file redirect.

**How to apply:** if a Clerk upgrade reintroduces a blank/crashing web screen, check
whether the offending explicit-`.js` native spec path changed and update the resolver
match accordingly. Confirm success when web logs show "Clerk has been loaded with
development keys" and no `ContextNavigator` uncaught error.

**Note on screenshots:** on a hard web refresh Clerk re-initializes (~1-2s), during which
the AuthGate loading overlay shows a solid dark background — automated screenshots taken
in that window look black even though the app is fine. Verify via browser logs (Clerk
loaded, route animations running) rather than trusting a single black screenshot.
