#!/usr/bin/env bash
# Render.com build: sync DB schema, build admin SPA + API, bundle admin into API dist.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

pnpm install --frozen-lockfile

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL must be set for schema sync" >&2
  exit 1
fi

echo "==> Sync database schema"
pnpm --filter @workspace/db run push-force

echo "==> Build admin panel"
if [ -z "${NEON_AUTH_BASE_URL:-}" ]; then
  echo "ERROR: NEON_AUTH_BASE_URL must be set for admin auth" >&2
  exit 1
fi
PORT=8080 \
  BASE_PATH=/admin/ \
  VITE_NEON_AUTH_URL="$NEON_AUTH_BASE_URL" \
  NODE_ENV=production \
  pnpm --filter @workspace/admin run build

echo "==> Build API server"
pnpm --filter @workspace/api-server run build

echo "==> Bundle admin static files into API dist"
rm -rf artifacts/api-server/dist/admin-static
cp -r artifacts/admin/dist/public artifacts/api-server/dist/admin-static

if [ ! -f artifacts/api-server/dist/admin-static/index.html ]; then
  echo "ERROR: admin static bundle missing at artifacts/api-server/dist/admin-static/index.html" >&2
  exit 1
fi

echo "==> Render build complete"
