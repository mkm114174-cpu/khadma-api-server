#!/usr/bin/env node
/**
 * Verify adminStatic path resolution after build.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const distDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../dist",
);
const indexPath = path.join(distDir, "index.mjs");
const adminDir = path.join(distDir, "admin-static");

assert.ok(fs.existsSync(indexPath), "dist/index.mjs must exist — run pnpm build first");

// Simulate bundled resolveAdminStaticDir logic (here = dist/)
const here = distDir;
const candidates = [
  path.resolve(here, "admin-static"),
  path.resolve(here, "../admin-static"),
  path.resolve(here, "../../admin/dist/public"),
];

const resolved = candidates.find((dir) =>
  fs.existsSync(path.join(dir, "index.html")),
);

if (!resolved) {
  console.error("Admin static not found. Checked:");
  for (const c of candidates) console.error("  -", c);
  process.exit(1);
}

console.log("adminStatic resolves to:", resolved);
assert.equal(resolved, adminDir, "expected dist/admin-static as primary path");
console.log("verify-admin-static: OK");
