import express, { type Express } from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { logger } from "./logger";

const ADMIN_MOUNT = "/admin";

function findMonorepoRoot(): string {
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return process.cwd();
}

/** Resolve built admin SPA directory (Render copies to dist/admin-static). */
export function resolveAdminStaticDir(): string | null {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const root = findMonorepoRoot();
  const candidates = [
    // Bundled output: dist/index.mjs → dist/admin-static
    path.resolve(here, "admin-static"),
    path.resolve(here, "../admin-static"),
    path.resolve(root, "artifacts/api-server/dist/admin-static"),
    path.resolve(root, "artifacts/admin/dist/public"),
    path.resolve(here, "../../admin/dist/public"),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, "index.html"))) {
      return dir;
    }
  }
  return null;
}

export function mountAdminApp(app: Express): void {
  const adminDir = resolveAdminStaticDir();
  if (!adminDir) {
    logger.warn("Admin panel not built — /admin/ will 404 until admin is included in deploy");
    return;
  }

  logger.info({ adminDir }, "Serving admin panel");

  app.get("/admin", (_req, res) => {
    res.redirect(301, `${ADMIN_MOUNT}/`);
  });

  app.use(`${ADMIN_MOUNT}`, express.static(adminDir, { index: "index.html" }));

  // SPA fallback for client-side routes (e.g. /admin/dashboard).
  app.use(`${ADMIN_MOUNT}`, (_req, res) => {
    res.sendFile(path.join(adminDir, "index.html"));
  });
}
