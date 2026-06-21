import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { ProvisionUserBody, UpdateCurrentUserBody } from "@workspace/api-zod";
import { requireAuth, requireUser, resolveDbUser, type AuthedRequest } from "../lib/auth";

const router: IRouter = Router();

router.get("/users/me", requireUser, (req: Request, res: Response) => {
  res.json((req as AuthedRequest).dbUser);
});

const OWNER_EMAIL = "mkm114174@gmail.com";

router.post(
  "/users",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const parsed = ProvisionUserBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input" });
      return;
    }
    const authUserId = (req as AuthedRequest).authUserId!;
    const jwtEmail = (req as AuthedRequest).authEmail ?? null;

    const existing = await resolveDbUser(
      authUserId,
      jwtEmail ?? parsed.data.email ?? null,
    );
    if (existing) {
      res.json(existing);
      return;
    }

    let { name, role, email, phone, commissionAgreed, language } = parsed.data;
    const resolvedEmail = (jwtEmail ?? email ?? "").trim().toLowerCase();
    const effectiveRole =
      resolvedEmail === OWNER_EMAIL ? ("admin" as const) : role;
    if (effectiveRole === "provider" && !commissionAgreed) {
      res.status(400).json({ error: "Commission agreement required" });
      return;
    }
    try {
      const [created] = await db
        .insert(usersTable)
        .values({
          authUserId,
          name,
          role: effectiveRole,
          email: email ?? jwtEmail ?? null,
          phone: phone ?? null,
          language: language ?? "ar",
          commissionAgreedAt: effectiveRole === "provider" ? new Date() : null,
        })
        .returning();
      res.json(created);
    } catch (err) {
      console.error("[users] provision insert failed:", err);
      res.status(500).json({ error: "Failed to create user" });
    }
  },
);

router.patch(
  "/users/me",
  requireUser,
  async (req: Request, res: Response): Promise<void> => {
    const parsed = UpdateCurrentUserBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input" });
      return;
    }
    const user = (req as AuthedRequest).dbUser!;
    const [updated] = await db
      .update(usersTable)
      .set({ ...parsed.data })
      .where(eq(usersTable.id, user.id))
      .returning();
    res.json(updated);
  },
);

export default router;
