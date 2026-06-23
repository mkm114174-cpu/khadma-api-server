# خدمة (Khadma)

تطبيق موبايل ذكي لحجز الخدمات المنزلية والشخصية بواجهة داكنة وخريطة تفاعلية.

## Run & Operate

- `pnpm --filter @workspace/khadma run dev` — run Expo mobile app
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo SDK 54 + Expo Router (file-based routing)
- Maps: react-native-maps@1.18.0 (exact pin — only version working with Expo Go)
- Auth: Clerk (@clerk/expo) — email/password + Google SSO; roles customer/provider/admin
- State: React Context + AsyncStorage (cart/orders); auth profile from API
- API: Express 5 (Clerk-authed, Zod-validated routes; contract-first via OpenAPI)
- DB: PostgreSQL + Drizzle ORM (users, providers, requests, offers, reviews, notifications, contact_messages)
- Storage: object storage for request images

## Where things live

- `artifacts/khadma/` — Expo mobile app
  - `app/_layout.tsx` — ClerkProvider + AuthGate (status-based routing, loading/error overlays)
  - `app/(auth)/role.tsx` — Pick customer/provider, then go to sign-up
  - `app/(auth)/sign-up.tsx` / `sign-in.tsx` — Clerk email/password + Google SSO
  - `app/(auth)/complete.tsx` — Collect name+role and provision backend profile
  - `context/AuthContext.tsx` — Clerk → status machine bridge (loading/signedOut/needsProvision/ready/error)
  - `components/GoogleAuthButton.tsx` — Google SSO via useSSO
  - `metro.config.js` — Clerk web resolver fix (see Gotchas)
  - `app/(tabs)/index.tsx` — Home screen with map
  - `context/CartContext.tsx` — Cart state (AsyncStorage backed)
  - `context/OrdersContext.tsx` — Orders state (AsyncStorage backed)
  - `constants/services.ts` — All service & category data
  - `constants/colors.ts` — Dark/light theme tokens
  - `components/KhadmaMap.native.tsx` — Real MapView (native only)
  - `components/KhadmaMap.tsx` — Web fallback for map
- `artifacts/api-server/` — Express API server (Clerk auth, Zod-validated routes, object storage)
  - `src/lib/auth.ts` — requireAuth / requireUser / role helpers (404 = not provisioned)
- `lib/api-spec/openapi.yaml` — API contract (run codegen after edits)
- `lib/db/src/schema/index.ts` — Drizzle schema (all tables)

## Architecture decisions

- react-native-maps is only loaded on native via platform-specific files (KhadmaMap.native.tsx / KhadmaMap.tsx) — the package doesn't support web bundling in v1.18.0
- Cart/orders use AsyncStorage; auth identity is real (Clerk) and the user profile lives in the backend DB
- Auth is a status machine in AuthContext: loading/signedOut/needsProvision/ready/error. Provisioning is explicit (complete.tsx), NOT JIT — server returns 404 "User not provisioned" until then
- Error classification: only a 404 from /users/me means needsProvision; network/5xx/401 → error status (retry overlay), never the provisioning screen
- On mobile there is no cookie jar — the Clerk session token is attached as a bearer header via setAuthTokenGetter
- userInterfaceStyle: "dark" forced in app.json — golden yellow (#F5C518) primary color throughout
- expo-location added to plugins in app.json for iOS/Android permission strings

## Product

- Home: Interactive map (GPS) showing nearby service providers as colored markers
- خدماتي: Browse 16 services across 4 categories (Beauty, Health, Home, Maintenance)
- سلتي: Cart with quantity controls and order confirmation
- طلباتي: Order history with live status (pending/active/completed/cancelled)

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- react-native-maps MUST be pinned to 1.18.0 — other versions crash in Expo Go
- Do NOT add react-native-maps to the plugins array in app.json — it will crash
- Platform-specific files for map: .native.tsx uses react-native-maps, .tsx is web fallback
- expo-location has no web support — use Platform.OS !== "web" guard and navigator.geolocation fallback
- @clerk/expo crashes on react-native-web (explicit-.js native spec import). Fixed by a metro.config.js resolveRequest redirect of `specs/NativeClerkModule.js` → `NativeClerkModule.web.js` on web only. Do NOT alias the whole package to @clerk/expo/web (no ClerkProvider/hooks there)
- On a hard web refresh Clerk re-inits ~1-2s and the AuthGate loading overlay shows a dark bg — automated screenshots in that window look black even though the app is fine. Confirm via browser logs, not a single screenshot

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
