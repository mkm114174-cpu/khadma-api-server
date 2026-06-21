import express, { type Express } from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { logger } from "./logger";

const ADMIN_MOUNT = "/admin";

/** Resolve built admin SPA directory (Render copies to dist/admin-static). */
export function resolveAdminStaticDir(): string | null {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const cwd = process.cwd();
  const candidates = [
    // Bundled output: dist/index.mjs → dist/admin-static (Render build copies here)
    path.resolve(here, "admin-static"),
    // Legacy / misconfigured deploy layout
    path.resolve(here, "../admin-static"),
    // Monorepo root cwd (Render start/build)
    path.resolve(cwd, "artifacts/api-server/dist/admin-static"),
    path.resolve(cwd, "artifacts/admin/dist/public"),
    // Local dev when running from source (src/lib → admin/dist/public)
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
