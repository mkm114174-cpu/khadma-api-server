import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { logger } from "./logger";

export function findMonorepoRoot(): string {
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return process.cwd();
}

function adminIndexAt(dir: string): boolean {
  return fs.existsSync(path.join(dir, "index.html"));
}

/**
 * Ensure admin SPA files exist on disk before mountAdminApp runs.
 * Sets KHADMA_ADMIN_DIR when found or built.
 */
export async function prepareAdminStatic(): Promise<void> {
  const forced = process.env.KHADMA_ADMIN_DIR?.trim();
  if (forced && adminIndexAt(forced)) {
    return;
  }

  const root = findMonorepoRoot();
  const candidates = [
    path.join(root, "artifacts/api-server/dist/admin-static"),
    path.join(root, "artifacts/api-server/admin-bundle"),
    path.join(root, "artifacts/admin/dist/public"),
  ];

  for (const dir of candidates) {
    if (adminIndexAt(dir)) {
      process.env.KHADMA_ADMIN_DIR = dir;
      logger.info({ adminDir: dir }, "Admin static files found");
      return;
    }
  }

  const neon = process.env.NEON_AUTH_BASE_URL?.trim();
  if (!neon) {
    logger.warn("Admin static missing and NEON_AUTH_BASE_URL not set — /admin/ disabled");
    return;
  }

  logger.warn("Admin static missing — building admin panel at startup");
  execSync("pnpm --filter @workspace/admin run build", {
    cwd: root,
    stdio: "inherit",
    env: {
      ...process.env,
      PORT: process.env.PORT ?? "8080",
      BASE_PATH: "/admin/",
      VITE_NEON_AUTH_URL: neon,
      NODE_ENV: "production",
    },
  });
  execSync("node artifacts/api-server/scripts/copy-admin-static.mjs", {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });

  const built = path.join(root, "artifacts/api-server/dist/admin-static");
  if (adminIndexAt(built)) {
    process.env.KHADMA_ADMIN_DIR = built;
    logger.info({ adminDir: built }, "Admin panel built at startup");
    return;
  }

  const fallback = path.join(root, "artifacts/admin/dist/public");
  if (adminIndexAt(fallback)) {
    process.env.KHADMA_ADMIN_DIR = fallback;
    logger.info({ adminDir: fallback }, "Admin panel available from admin/dist/public");
    return;
  }

  logger.error("Failed to prepare admin static files — /admin/ will 404");
}
