import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  offersTable,
  requestsTable,
  providersTable,
  notificationsTable,
} from "@workspace/db";
import { and, desc, eq, ne } from "drizzle-orm";
import {
  CreateOfferBody,
  UpdateOfferBody,
  ListOffersQueryParams,
} from "@workspace/api-zod";
import {
  requireUser,
  getProviderByUserId,
  type AuthedRequest,
} from "../lib/auth";
import { isProviderAvailableNow } from "../lib/availability";
import { getCommissionOwed, OWED_THRESHOLD } from "../lib/commission";

const router: IRouter = Router();

router.get(
  "/offers",
  requireUser,
  async (req: Request, res: Response): Promise<void> => {
    const user = (req as AuthedRequest).dbUser!;
    const isAdmin = user.role === "admin";
    const parsed = ListOffersQueryParams.safeParse(req.query);
    const q = parsed.success ? parsed.data : {};
    const conds = [];

    // Access control: only admins may read offers globally. Non-admins are
    // restricted to their own offers (mine) or the offers on a request they own.
    if (isAdmin) {
      if (q.requestId !== undefined)
        conds.push(eq(offersTable.requestId, q.requestId));
      if (q.mine) {
        const provider = await getProviderByUserId(user.id);
        if (!provider) {
          res.json([]);
          return;
        }
        conds.push(eq(offersTable.providerId, provider.id));
      }
    } else if (q.mine) {
      const provider = await getProviderByUserId(user.id);
      if (!provider) {
        res.json([]);
        return;
      }
      conds.push(eq(offersTable.providerId, provider.id));
      if (q.requestId !== undefined)
        conds.push(eq(offersTable.requestId, q.requestId));
    } else if (q.requestId !== undefined) {
      // Only the owner of the request may list its offers this way.
      const [request] = await db
        .select()
        .from(requestsTable)
        .where(eq(requestsTable.id, q.requestId))
        .limit(1);
      if (!request || request.userId !== user.id) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
      conds.push(eq(offersTable.requestId, q.requestId));
    } else {
      // No valid self-scoped query → deny the marketplace-wide firehose.
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const rows = await db
      .select()
      .from(offersTable)
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(offersTable.createdAt));
    res.json(rows);
  },
);

router.post(
  "/offers",
  requireUser,
  async (req: Request, res: Response): Promise<void> => {
    const parsed = CreateOfferBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input" });
      return;
    }
    const user = (req as AuthedRequest).dbUser!;
    const provider = await getProviderByUserId(user.id);
    if (!provider) {
      res.status(403).json({ error: "Not a provider" });
      return;
    }
    if (provider.status !== "approved") {
      res.status(403).json({ error: "Provider not approved" });
      return;
    }
    if (!isProviderAvailableNow(provider)) {
      res.status(403).json({ error: "Provider not available" });
      return;
    }
    // Block providers who owe more than the allowed commission threshold from
    // taking on new jobs until they settle their balance.
    const owed = await getCommissionOwed(provider.id);
    if (owed > OWED_THRESHOLD) {
      res.status(403).json({
        error: "Commission balance exceeded. Please settle to take new jobs.",
        code: "commission_blocked",
      });
      return;
    }
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
    const [created] = await db
      .insert(offersTable)
      .values({
        requestId: d.requestId,
        providerId: provider.id,
        price: d.price,
        message: d.message ?? null,
        availableTime: d.availableTime ?? null,
        estimatedDuration: d.estimatedDuration ?? null,
        status: "pending",
      })
      .returning();
    await db.insert(notificationsTable).values({
      userId: request.userId,
      title: "عرض جديد",
      body: `تلقيت عرضاً جديداً على طلبك ${request.requestNumber}`,
      type: "offer",
      data: { requestId: request.id, offerId: created.id },
    });
    res.status(201).json(created);
  },
);

router.patch(
  "/offers/:id",
  requireUser,
  async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const parsed = UpdateOfferBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input" });
      return;
    }
    const user = (req as AuthedRequest).dbUser!;
    const [offer] = await db
      .select()
      .from(offersTable)
      .where(eq(offersTable.id, id))
      .limit(1);
    if (!offer) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const [request] = await db
      .select()
      .from(requestsTable)
      .where(eq(requestsTable.id, offer.requestId))
      .limit(1);
    if (!request) {
      res.status(404).json({ error: "Request not found" });
      return;
    }

    const provider = await getProviderByUserId(user.id);
    const isRequestOwner = request.userId === user.id;
    const isOfferProvider = provider && provider.id === offer.providerId;
    const isAdmin = user.role === "admin";

    // Accept/reject is done by the request owner (or admin). Providers may
    // withdraw their own offer (set to rejected).
    const nextStatus = parsed.data.status;
    if (nextStatus === "accepted") {
      if (!isRequestOwner && !isAdmin) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
      // Guard against stale/duplicate acceptance: the offer must still be
      // pending and the request must not have been assigned already. Without
      // this, a retried/raced accept could re-assign the request and emit
      // duplicate acceptance/rejection notifications.
      if (offer.status !== "pending") {
        res.status(409).json({ error: "Offer is no longer pending" });
        return;
      }
      if (request.status !== "pending" && request.status !== "active") {
        res.status(409).json({ error: "Request is no longer accepting offers" });
        return;
      }
      if (request.providerId != null) {
        res.status(409).json({ error: "Request already has an assigned provider" });
        return;
      }
      const [updated] = await db
        .update(offersTable)
        .set({ status: "accepted" })
        .where(eq(offersTable.id, id))
        .returning();
      // Reject the other pending offers on the same request, and notify
      // each of those providers that their offer was not chosen.
      const otherOffers = await db
        .select()
        .from(offersTable)
        .where(
          and(eq(offersTable.requestId, request.id), ne(offersTable.id, id)),
        );
      await db
        .update(offersTable)
        .set({ status: "rejected" })
        .where(
          and(eq(offersTable.requestId, request.id), ne(offersTable.id, id)),
        );
      for (const o of otherOffers) {
        if (o.status !== "pending") continue;
        const [pr] = await db
          .select()
          .from(providersTable)
          .where(eq(providersTable.id, o.providerId))
          .limit(1);
        if (pr) {
          await db.insert(notificationsTable).values({
            userId: pr.userId,
            title: "تم رفض عرضك",
            body: `لم يتم اختيار عرضك على الطلب ${request.requestNumber}`,
            type: "offer_rejected",
            data: { requestId: request.id, offerId: o.id },
          });
        }
      }
      // Assign the provider and activate the request.
      await db
        .update(requestsTable)
        .set({
          providerId: offer.providerId,
          status: "active",
          priceMin: offer.price,
          priceMax: offer.price,
        })
        .where(eq(requestsTable.id, request.id));
      // Notify the provider that their offer was accepted.
      const [providerRow] = await db
        .select()
        .from(providersTable)
        .where(eq(providersTable.id, offer.providerId))
        .limit(1);
      if (providerRow) {
        await db.insert(notificationsTable).values({
          userId: providerRow.userId,
          title: "تم قبول عرضك",
          body: `تم قبول عرضك على الطلب ${request.requestNumber}`,
          type: "offer_accepted",
          data: { requestId: request.id, offerId: id },
        });
      }
      res.json(updated);
      return;
    }

    if (!isRequestOwner && !isOfferProvider && !isAdmin) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const [updated] = await db
      .update(offersTable)
      .set({ ...parsed.data })
      .where(eq(offersTable.id, id))
      .returning();
    // If the request owner (not the provider withdrawing) rejected this offer,
    // notify the provider.
    if (
      parsed.data.status === "rejected" &&
      offer.status === "pending" &&
      !isOfferProvider
    ) {
      const [pr] = await db
        .select()
        .from(providersTable)
        .where(eq(providersTable.id, offer.providerId))
        .limit(1);
      if (pr) {
        await db.insert(notificationsTable).values({
          userId: pr.userId,
          title: "تم رفض عرضك",
          body: `لم يتم اختيار عرضك على الطلب ${request.requestNumber}`,
          type: "offer_rejected",
          data: { requestId: request.id, offerId: offer.id },
        });
      }
    }
    res.json(updated);
  },
);

export default router;
