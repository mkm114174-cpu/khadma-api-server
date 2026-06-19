import { Router, type IRouter, type Request, type Response } from "express";
import { db, contactMessagesTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { CreateMessageBody, UpdateMessageBody } from "@workspace/api-zod";
import { optionalUser, requireRole, type AuthedRequest } from "../lib/auth";

const router: IRouter = Router();

router.get(
  "/messages",
  requireRole("admin"),
  async (_req: Request, res: Response): Promise<void> => {
    const rows = await db
      .select()
      .from(contactMessagesTable)
      .orderBy(desc(contactMessagesTable.createdAt));
    res.json(rows);
  },
);

router.post(
  "/messages",
  optionalUser,
  async (req: Request, res: Response): Promise<void> => {
    const parsed = CreateMessageBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input" });
      return;
    }
    const user = (req as AuthedRequest).dbUser;
    const d = parsed.data;
    const [created] = await db
      .insert(contactMessagesTable)
      .values({
        userId: user?.id ?? null,
        name: d.name,
        email: d.email ?? null,
        subject: d.subject ?? null,
        message: d.message,
        status: "open",
      })
      .returning();
    res.status(201).json(created);
  },
);

router.patch(
  "/messages/:id",
  requireRole("admin"),
  async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const parsed = UpdateMessageBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input" });
      return;
    }
    const [updated] = await db
      .update(contactMessagesTable)
      .set({ ...parsed.data })
      .where(eq(contactMessagesTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(updated);
  },
);

export default router;
