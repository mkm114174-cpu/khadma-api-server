#!/usr/bin/env node
/**
 * Fail fast if core tables are missing — used after drizzle push (build + startup).
 */
import assert from "node:assert/strict";
import pg from "pg";

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("verify-db-schema: DATABASE_URL is not set");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: url });

const REQUIRED_TABLES = [
  "users",
  "skills",
  "providers",
  "service_requests",
  "offers",
];

try {
  for (const table of REQUIRED_TABLES) {
    const res = await pool.query(
      `SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = $1`,
      [table],
    );
    assert.ok(res.rowCount && res.rowCount > 0, `missing table: ${table}`);
    console.log(`✓ table ${table}`);
  }
  console.log("verify-db-schema: OK");
} catch (err) {
  console.error("verify-db-schema FAILED:", err instanceof Error ? err.message : err);
  process.exit(1);
} finally {
  await pool.end();
}
