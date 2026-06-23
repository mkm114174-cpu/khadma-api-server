import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

/** Verify Neon Auth env + JWKS — helps diagnose Render deployment. */
router.get("/healthz/auth", async (_req, res) => {
  const base = process.env.NEON_AUTH_BASE_URL?.trim().replace(/\/+$/, "");
  if (!base) {
    res.status(503).json({
      status: "error",
      reason: "NEON_AUTH_BASE_URL is not set on the API server",
    });
    return;
  }
  try {
    const jwksRes = await fetch(`${base}/.well-known/jwks.json`);
    if (!jwksRes.ok) {
      res.status(503).json({
        status: "error",
        reason: `JWKS fetch failed (${jwksRes.status})`,
        neonAuthBaseUrl: base,
      });
      return;
    }
    res.json({ status: "ok", neonAuthBaseUrl: base });
  } catch (err) {
    res.status(503).json({
      status: "error",
      reason: err instanceof Error ? err.message : String(err),
      neonAuthBaseUrl: base,
    });
  }
});

/** Verify Clerk + admin login route are configured (Render deploy check). */
router.get("/healthz/admin", (_req, res) => {
  const hasClerk = Boolean(process.env.CLERK_SECRET_KEY?.trim());
  res.json({
    status: hasClerk ? "ok" : "error",
    clerkConfigured: hasClerk,
    adminLoginPath: "/api/admin/auth/login",
  });
});

export default router;
