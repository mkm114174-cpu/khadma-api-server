import { Router, type IRouter, type Request, type Response } from "express";
import { db, notificationsTable } from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import { UpdateNotificationBody } from "@workspace/api-zod";
import { requireUser, type AuthedRequest } from "../lib/auth";

const router: IRouter = Router();

router.get(
  "/notifications",
  requireUser,
  async (req: Request, res: Response): Promise<void> => {
    const user = (req as AuthedRequest).dbUser!;
    const rows = await db
      .select()
      .from(notificationsTable)
      .where(eq(notificationsTable.userId, user.id))
      .orderBy(desc(notificationsTable.createdAt));
    res.json(rows);
  },
);

router.patch(
  "/notifications/:id",
  requireUser,
  async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const parsed = UpdateNotificationBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input" });
      return;
    }
    const user = (req as AuthedRequest).dbUser!;
    const [updated] = await db
      .update(notificationsTable)
      .set({ ...parsed.data })
      .where(
        and(
          eq(notificationsTable.id, id),
          eq(notificationsTable.userId, user.id),
        ),
      )
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(updated);
  },
);

export default router;
