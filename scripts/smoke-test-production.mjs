#!/usr/bin/env node
/**
 * Production smoke test — run against live Render deployment.
 * Usage: node scripts/smoke-test-production.mjs [baseUrl]
 */
import assert from "node:assert/strict";

const BASE =
  process.argv[2]?.replace(/\/$/, "") ??
  "https://khadma-api-server.onrender.com";

const failures = [];

async function check(name, fn) {
  try {
    await fn();
    console.log(`✓ ${name}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`✗ ${name}: ${msg}`);
    failures.push({ name, msg });
  }
}

await check("GET /api/healthz returns 200", async () => {
  const res = await fetch(`${BASE}/api/healthz`);
  assert.equal(res.status, 200, `expected 200 got ${res.status}`);
  const body = await res.json();
  assert.equal(body.status, "ok");
});

await check("GET /api/skills returns 200 with array", async () => {
  const res = await fetch(`${BASE}/api/skills`);
  assert.equal(res.status, 200, `expected 200 got ${res.status}`);
  const body = await res.json();
  assert.ok(Array.isArray(body), "skills response must be an array");
});

await check("GET /admin/ returns 200 (admin SPA)", async () => {
  const res = await fetch(`${BASE}/admin/`);
  assert.equal(res.status, 200, `expected 200 got ${res.status}`);
  const html = await res.text();
  assert.ok(html.includes("<!DOCTYPE html") || html.includes("<html"), "admin must serve HTML");
});

await check("GET /api/users/me without token returns 401", async () => {
  const res = await fetch(`${BASE}/api/users/me`);
  assert.equal(res.status, 401, `expected 401 got ${res.status}`);
});

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed.`);
  console.error(
    "If skills/admin fail: redeploy on Render with DATABASE_URL and bash scripts/render-build.sh",
  );
  process.exit(1);
}

console.log("\nAll production smoke checks passed.");
