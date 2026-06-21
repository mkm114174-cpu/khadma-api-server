#!/usr/bin/env bash
# Render runtime: ensure DB schema exists, then start API (idempotent).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "FATAL: DATABASE_URL must be set at runtime on Render" >&2
  exit 1
fi

if [ -z "${NEON_AUTH_BASE_URL:-}" ]; then
  echo "WARN: NEON_AUTH_BASE_URL not set — API auth may fail; admin rebuild skipped"
fi

echo "==> Startup: sync database schema (idempotent)"
pnpm --filter @workspace/db run push-force

echo "==> Startup: verify core tables"
node scripts/verify-db-schema.mjs

if [ ! -f artifacts/api-server/dist/admin-static/index.html ] && [ -n "${NEON_AUTH_BASE_URL:-}" ]; then
  echo "WARN: admin-static missing at startup — rebuilding admin bundle"
  PORT=8080 \
    BASE_PATH=/admin/ \
    VITE_NEON_AUTH_URL="$NEON_AUTH_BASE_URL" \
    NODE_ENV=production \
    pnpm --filter @workspace/admin run build
  mkdir -p artifacts/api-server/dist/admin-static
  cp -r artifacts/admin/dist/public/. artifacts/api-server/dist/admin-static/
fi

if [ ! -f artifacts/api-server/dist/index.mjs ]; then
  echo "FATAL: API dist missing — run render-build.sh on deploy" >&2
  exit 1
fi

echo "==> Starting Khadma API"
exec node --enable-source-maps artifacts/api-server/dist/index.mjs
