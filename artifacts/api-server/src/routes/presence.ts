import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable } from "@workspace/db";
import { count, eq, gte } from "drizzle-orm";
import { requireUser, type AuthedRequest } from "../lib/auth";

const router: IRouter = Router();

// How long a user is considered "online" after their last heartbeat.
const ONLINE_WINDOW_MINUTES = 5;
// Skip writes if the last heartbeat is newer than this, to avoid hammering the DB.
const PING_THROTTLE_MS = 60_000;

router.post(
  "/presence/ping",
  requireUser,
  async (req: Request, res: Response): Promise<void> => {
    const user = (req as AuthedRequest).dbUser!;
    const now = Date.now();
    const lastSeen = user.lastSeenAt ? new Date(user.lastSeenAt).getTime() : 0;
    if (now - lastSeen >= PING_THROTTLE_MS) {
      await db
        .update(usersTable)
        .set({ lastSeenAt: new Date(now) })
        .where(eq(usersTable.id, user.id));
    }
    res.status(204).end();
  },
);

router.get(
  "/admin/online-count",
  requireUser,
  async (req: Request, res: Response): Promise<void> => {
    const user = (req as AuthedRequest).dbUser!;
    if (user.role !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const cutoff = new Date(Date.now() - ONLINE_WINDOW_MINUTES * 60_000);
    const [row] = await db
      .select({ value: count() })
      .from(usersTable)
      .where(gte(usersTable.lastSeenAt, cutoff));
    res.json({
      count: row?.value ?? 0,
      windowMinutes: ONLINE_WINDOW_MINUTES,
    });
  },
);

export default router;
