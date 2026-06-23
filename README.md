# Khadma — Full stack setup

## Architecture

```
Flutter APK  →  Render API (khadma-api-server.onrender.com)  →  Neon PostgreSQL
            ↘  Neon Auth (email OTP)
```

## Render environment variables (REQUIRED)

In [Render Dashboard](https://dashboard.render.com) → **khadma-api** → **Environment**:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `NEON_AUTH_BASE_URL` | `https://ep-green-brook-aso0ob6f.neonauth.c-4.eu-central-1.aws.neon.tech/neondb/auth` |
| `NODE_ENV` | `production` |
| `PORT` | `8080` |

After changing env vars or code, click **Manual Deploy → Deploy latest commit**.

## Verify deployment

```powershell
.\scripts\verify-khadma.ps1
```

Expected:
- `healthz` → 200
- `healthz/auth` → 200 (after API redeploy with latest code)
- `skills` → 200

## Build Flutter APK

```powershell
cd flutter_app
.\scripts\build-apk.ps1
```

Output: `flutter_app\dist\khadma-release.apk`

## Known issues fixed (2026-06-22)

1. **API JWT verification** — issuer was wrong (`origin` only). Fixed in `artifacts/api-server/src/lib/neonAuth.ts`. **Must redeploy API.**
2. **Flutter auth** — session cookies + JWT persistence, post-login flow goes to complete profile like Expo.
3. **Error overlay** — no longer blocks auth screens during login.

## Local API dev

```bash
pnpm install
# Set artifacts/api-server/.env with DATABASE_URL + NEON_AUTH_BASE_URL
pnpm --filter @workspace/api-server run dev
```
