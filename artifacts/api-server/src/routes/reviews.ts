import { Router, type IRouter, type Request, type Response } from "express";
import { db, reviewsTable, requestsTable, providersTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { CreateReviewBody, ListReviewsQueryParams } from "@workspace/api-zod";
import { requireUser, type AuthedRequest } from "../lib/auth";

const router: IRouter = Router();

router.get("/reviews", async (req: Request, res: Response): Promise<void> => {
  const parsed = ListReviewsQueryParams.safeParse(req.query);
  const q = parsed.success ? parsed.data : {};
  const rows = q.providerId
    ? await db
        .select()
        .from(reviewsTable)
        .where(eq(reviewsTable.providerId, q.providerId))
        .orderBy(desc(reviewsTable.createdAt))
    : await db
        .select()
        .from(reviewsTable)
        .orderBy(desc(reviewsTable.createdAt));
  res.json(rows);
});

router.post(
  "/reviews",
  requireUser,
  async (req: Request, res: Response): Promise<void> => {
    const parsed = CreateReviewBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input" });
      return;
    }
    const user = (req as AuthedRequest).dbUser!;
    const d = parsed.data;
    const [request] = await db
      .select()
      .from(requestsTable)
      .where(eq(requestsTable.id, d.requestId))
      .limit(1);
    if (!request) {
      res.status(404).json({ error: "Request not found" });
      return;
    }
    if (request.userId !== user.id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const [created] = await db
      .insert(reviewsTable)
      .values({
        requestId: d.requestId,
        providerId: d.providerId,
        userId: user.id,
        rating: d.rating,
        comment: d.comment ?? null,
      })
      .returning();

    // Recompute the provider's aggregate rating.
    const reviews = await db
      .select()
      .from(reviewsTable)
      .where(eq(reviewsTable.providerId, d.providerId));
    const ratingCount = reviews.length;
    const avg =
      ratingCount > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / ratingCount
        : 0;
    await db
      .update(providersTable)
      .set({ rating: avg, ratingCount })
      .where(eq(providersTable.id, d.providerId));

    res.status(201).json(created);
  },
);

export default router;
