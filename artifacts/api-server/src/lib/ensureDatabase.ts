import { pool } from "@workspace/db";
import { logger } from "./logger";

const CORE_TABLES = ["users", "skills", "providers"] as const;

/** Confirms drizzle schema is present before serving traffic. */
export async function verifyCoreTables(): Promise<void> {
  for (const table of CORE_TABLES) {
    try {
      await pool.query(`SELECT 1 FROM ${table} LIMIT 1`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error({ table, message }, "Core database table missing");
      throw new Error(
        `Database schema incomplete (missing "${table}"). ` +
          "Run drizzle push-force with DATABASE_URL set.",
      );
    }
  }
  logger.info("Core database tables verified");
}
