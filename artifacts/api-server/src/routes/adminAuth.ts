import { Router, type IRouter, type Request, type Response } from "express";
import { resolveDbUser } from "../lib/auth";

const router: IRouter = Router();
const CLERK_API = "https://api.clerk.com/v1";

async function clerkApi(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const secretKey = process.env.CLERK_SECRET_KEY?.trim();
  if (!secretKey) {
    throw new Error("CLERK_SECRET_KEY is not configured");
  }
  return fetch(`${CLERK_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
      ...(init?.headers as Record<string, string> | undefined),
    },
  });
}

/** تسجيل دخول الأدمن من تطبيق الموبايل — يتحقق عبر Clerk Backend ثم يُرجع JWT. */
router.post("/admin/auth/login", async (req: Request, res: Response) => {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");
  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }

  if (!process.env.CLERK_SECRET_KEY?.trim()) {
    res.status(503).json({
      error: "CLERK_SECRET_KEY is not configured on the API server",
    });
    return;
  }

  try {
    const createRes = await clerkApi("/sign_ins", {
      method: "POST",
      body: JSON.stringify({ identifier: email }),
    });
    const createData = (await createRes.json()) as {
      id?: string;
      errors?: Array<{ message?: string }>;
    };
    if (!createRes.ok || !createData.id) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const signInId = createData.id;

    const prepareRes = await clerkApi(
      `/sign_ins/${signInId}/prepare_first_factor`,
      {
        method: "POST",
        body: JSON.stringify({ strategy: "password" }),
      },
    );
    const prepareData = (await prepareRes.json()) as { status?: string };
    if (!prepareRes.ok || prepareData.status !== "needs_first_factor") {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const attemptRes = await clerkApi(
      `/sign_ins/${signInId}/attempt_first_factor`,
      {
        method: "POST",
        body: JSON.stringify({ strategy: "password", password }),
      },
    );
    const attemptData = (await attemptRes.json()) as {
      status?: string;
      created_session_id?: string;
      user_id?: string;
    };

    if (!attemptRes.ok || attemptData.status !== "complete") {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const sessionId = attemptData.created_session_id;
    const authUserId = attemptData.user_id;
    if (!sessionId || !authUserId) {
      res.status(500).json({ error: "Session not created" });
      return;
    }

    const dbUser = await resolveDbUser(authUserId, email);
    if (!dbUser || dbUser.role !== "admin") {
      res.status(403).json({ error: "Admin access only" });
      return;
    }

    const tokenRes = await clerkApi(`/sessions/${sessionId}/tokens`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    const tokenData = (await tokenRes.json()) as { jwt?: string };
    if (!tokenRes.ok || !tokenData.jwt) {
      res.status(500).json({ error: "Failed to create session token" });
      return;
    }

    res.json({
      token: tokenData.jwt,
      user: {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
      },
    });
  } catch (err) {
    res.status(500).json({
      error: "Login failed",
      detail: err instanceof Error ? err.message : String(err),
    });
  }
});

export default router;
