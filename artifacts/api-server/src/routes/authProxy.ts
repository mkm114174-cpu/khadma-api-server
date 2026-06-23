import { Router, type IRouter, type Request, type Response } from "express";

/**
 * Proxies Better Auth / Neon Auth for mobile clients.
 * Android often blocks or strips Origin: khadma:// — the server sends trusted headers.
 */
const router: IRouter = Router();

function authBaseUrl(): string | null {
  const base = process.env.NEON_AUTH_BASE_URL?.trim().replace(/\/+$/, "");
  return base || null;
}

// Express 5: avoid legacy "/*" wildcard (breaks path-to-regexp).
router.use(async (req: Request, res: Response): Promise<void> => {
  const base = authBaseUrl();
  if (!base) {
    res.status(503).json({
      error: "NEON_AUTH_BASE_URL is not set on the API server",
    });
    return;
  }

  const path = req.path === "/" ? "" : req.path;
  const qs = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
  const target = `${base}${path}${qs}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type":
      (req.headers["content-type"] as string | undefined) ??
      "application/json",
    Origin: "khadma://",
    "expo-origin": "khadma://",
  };

  const cookie = req.headers.cookie;
  if (cookie) headers.Cookie = cookie;

  const authorization = req.headers.authorization;
  if (authorization) headers.Authorization = authorization;

  const hasBody = !["GET", "HEAD"].includes(req.method.toUpperCase());
  const body =
    hasBody && req.body != null && Object.keys(req.body).length > 0
      ? JSON.stringify(req.body)
      : hasBody && req.body != null
        ? JSON.stringify(req.body)
        : undefined;

  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers,
      body,
    });

    res.status(upstream.status);

    const jwt = upstream.headers.get("set-auth-jwt");
    if (jwt) res.setHeader("set-auth-jwt", jwt);

    const setCookies = upstream.headers.getSetCookie?.() ?? [];
    for (const raw of setCookies) {
      // Strip Neon domain so cookies work on the Render host.
      const rewritten = raw
        .split(";")
        .map((p) => p.trim())
        .filter((p) => p.length > 0 && !/^domain=/i.test(p))
        .join("; ");
      res.append("Set-Cookie", rewritten);
    }

    const contentType = upstream.headers.get("content-type") ?? "application/json";
    res.setHeader("Content-Type", contentType);
    const text = await upstream.text();
    res.send(text);
  } catch (err) {
    res.status(502).json({
      error: "Auth proxy failed",
      detail: err instanceof Error ? err.message : String(err),
    });
  }
});

export default router;
