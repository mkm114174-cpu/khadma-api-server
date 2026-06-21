import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/healthz", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    // Skills table must exist and be readable — provider onboarding and home depend on it.
    await pool.query("SELECT 1 FROM skills LIMIT 1");
    const data = HealthCheckResponse.parse({ status: "ok" });
    res.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    res.status(503).json({ status: "degraded", db: "unavailable", detail: message });
  }
});

export default router;
