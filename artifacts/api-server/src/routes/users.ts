import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { ProvisionUserBody, UpdateCurrentUserBody } from "@workspace/api-zod";
import { requireAuth, requireUser, resolveDbUser, type AuthedRequest } from "../lib/auth";

const router: IRouter = Router();

router.get("/users/me", requireUser, (req: Request, res: Response) => {
  res.json((req as AuthedRequest).dbUser);
});

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

    const { name, role, email, phone, commissionAgreed, language } = parsed.data;
    // Providers must explicitly consent to the platform commission. Enforce it
    // on the server too, so the agreement can never be bypassed client-side.
    if (role === "provider" && !commissionAgreed) {
      res.status(400).json({ error: "Commission agreement required" });
      return;
    }
    const [created] = await db
      .insert(usersTable)
      .values({
        authUserId,
        name,
        role,
        email: email ?? null,
        phone: phone ?? null,
        language: language ?? "ar",
        commissionAgreedAt: role === "provider" ? new Date() : null,
      })
      .returning();
    res.json(created);
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
