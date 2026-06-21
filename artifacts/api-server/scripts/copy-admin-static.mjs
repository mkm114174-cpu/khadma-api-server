#!/usr/bin/env node
/**
 * Copy built admin SPA next to API dist so /admin/ works on Render.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const apiRoot = path.resolve(here, "..");
const adminPublic = path.resolve(apiRoot, "../admin/dist/public");
const bundled = path.resolve(apiRoot, "admin-bundle");
const dest = path.resolve(apiRoot, "dist/admin-static");

function copyRecursive(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dst, entry.name);
    if (entry.isDirectory()) copyRecursive(from, to);
    else fs.copyFileSync(from, to);
  }
}

const source = fs.existsSync(path.join(adminPublic, "index.html"))
  ? adminPublic
  : fs.existsSync(path.join(bundled, "index.html"))
    ? bundled
    : null;

if (!source) {
  console.warn(
    "copy-admin-static: no admin build found (admin/dist/public or admin-bundle)",
  );
  process.exit(0);
}

fs.rmSync(dest, { recursive: true, force: true });
copyRecursive(source, dest);
console.log("copy-admin-static: OK →", dest, "(from", source + ")");
