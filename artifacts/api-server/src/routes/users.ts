import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { ProvisionUserBody, UpdateCurrentUserBody } from "@workspace/api-zod";
import { requireAuth, requireUser, resolveDbUser, requireRole, type AuthedRequest } from "../lib/auth";
import { OWNER_EMAIL } from "../lib/adminAccess";

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
          email: resolvedEmail || null,
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

// Admin: list all users
router.get(
  "/users",
  requireRole("admin"),
  async (_req: Request, res: Response): Promise<void> => {
    const rows = await db.select().from(usersTable).orderBy(desc(usersTable.id));
    res.json(rows);
  },
);

// Admin: suspend, unsuspend, or close an account
router.patch(
  "/users/:id/status",
  requireRole("admin"),
  async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid user id" });
      return;
    }
    const body = req.body as {
      accountStatus?: "active" | "suspended" | "closed";
      suspendedUntil?: string | null;
    };
    if (!body.accountStatus) {
      res.status(400).json({ error: "accountStatus required" });
      return;
    }
    const [updated] = await db
      .update(usersTable)
      .set({
        accountStatus: body.accountStatus,
        suspendedUntil:
          body.accountStatus === "suspended" && body.suspendedUntil
            ? new Date(body.suspendedUntil)
            : null,
      })
      .where(eq(usersTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(updated);
  },
);

export default router;
