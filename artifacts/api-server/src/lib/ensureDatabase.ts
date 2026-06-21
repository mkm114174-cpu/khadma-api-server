import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { pool } from "@workspace/db";
import { logger } from "./logger";

const CORE_TABLES = ["users", "skills", "providers"] as const;

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

async function tableReadable(table: string): Promise<boolean> {
  try {
    await pool.query(`SELECT 1 FROM ${table} LIMIT 1`);
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("does not exist")) return false;
    throw err;
  }
}

/**
 * Sync Drizzle schema when tables are missing (Render cold start / failed build push).
 * Idempotent when schema already matches.
 */
export async function ensureDatabaseSchema(): Promise<void> {
  const missing: string[] = [];
  for (const table of CORE_TABLES) {
    if (!(await tableReadable(table))) missing.push(table);
  }
  if (missing.length === 0) return;

  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error(
      `DATABASE_URL is not set; cannot create missing tables: ${missing.join(", ")}`,
    );
  }

  const root = process.cwd();
  logger.warn({ missing }, "Database schema incomplete — running drizzle push-force");

  execSync("pnpm --filter @workspace/db run push-force", {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });

  for (const table of CORE_TABLES) {
    if (!(await tableReadable(table))) {
      throw new Error(`Table still missing after schema sync: ${table}`);
    }
  }
  logger.info("Database schema sync completed");
}

/** Confirms drizzle schema is present before serving traffic. */
export async function verifyCoreTables(): Promise<void> {
  const missing: string[] = [];
  for (const table of CORE_TABLES) {
    if (!(await tableReadable(table))) missing.push(table);
  }
  if (missing.length > 0) {
    throw new Error(`Database schema incomplete (missing: ${missing.join(", ")})`);
  }
  logger.info("Core database tables verified");
}
