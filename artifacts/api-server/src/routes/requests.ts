import { Router, type IRouter, type Request, type Response } from "express";
import { randomUUID } from "crypto";
import {
  db,
  requestsTable,
  offersTable,
  notificationsTable,
  providersTable,
  providerSkillsTable,
  skillsTable,
  commissionLedgerTable,
  usersTable,
} from "@workspace/db";
import { and, desc, eq, inArray } from "drizzle-orm";
import { commissionForJob } from "../lib/commission";
import {
  CreateRequestBody,
  UpdateRequestBody,
  ListRequestsQueryParams,
} from "@workspace/api-zod";
import {
  requireUser,
  getProviderByUserId,
  type AuthedRequest,
} from "../lib/auth";
import { ObjectStorageService } from "../lib/objectStorage";
import { haversineKm } from "../lib/availability";

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

/**
 * Bind an uploaded request image to its owner and make it readable by
 * authenticated users (providers need to view request images). Returns the
 * normalized object path to persist, or the original value if it is not an
 * object-storage path. Best-effort: a failure to set the ACL must not block
 * request creation.
 */
async function bindRequestImage(
  imageUrl: string | null | undefined,
  ownerAuthUserId: string,
  log: AuthedRequest["log"],
): Promise<string | null> {
  if (!imageUrl) return null;
  try {
    return await objectStorageService.trySetObjectEntityAclPolicy(imageUrl, {
      owner: ownerAuthUserId,
      visibility: "public",
    });
  } catch (err) {
    log.warn({ err, imageUrl }, "Failed to set ACL on request image");
    return imageUrl;
  }
}

router.get(
  "/requests",
  requireUser,
  async (req: Request, res: Response): Promise<void> => {
    const user = (req as AuthedRequest).dbUser!;
    const isAdmin = user.role === "admin";
    const parsed = ListRequestsQueryParams.safeParse(req.query);
    const q = parsed.success ? parsed.data : {};
    const conds = [];

    // Access control: only admins may read the marketplace globally. Everyone
    // else is scoped server-side to data they are entitled to, regardless of
    // (or despite) the query params they send.
    let providerSkillIds: number[] | null = null;
    if (isAdmin) {
      if (q.mine) conds.push(eq(requestsTable.userId, user.id));
      if (q.providerId !== undefined)
        conds.push(eq(requestsTable.providerId, q.providerId));
      if (q.status) conds.push(eq(requestsTable.status, q.status));
    } else {
      const provider = await getProviderByUserId(user.id);
      if (q.providerId !== undefined) {
        // "My jobs" view: a provider may only query their own assigned jobs.
        if (!provider || q.providerId !== provider.id) {
          res.status(403).json({ error: "Forbidden" });
          return;
        }
        conds.push(eq(requestsTable.providerId, provider.id));
        if (q.status) conds.push(eq(requestsTable.status, q.status));
      } else if (q.status === "pending" && provider) {
        // Provider discovery: only pending requests matching their skills.
        conds.push(eq(requestsTable.status, "pending"));
        const ps = await db
          .select({ skillId: providerSkillsTable.skillId })
          .from(providerSkillsTable)
          .where(eq(providerSkillsTable.providerId, provider.id));
        providerSkillIds = ps.map((p) => p.skillId);
      } else {
        // Default: callers can only see their own requests.
        conds.push(eq(requestsTable.userId, user.id));
        if (q.status) conds.push(eq(requestsTable.status, q.status));
      }
    }

    if (providerSkillIds && providerSkillIds.length > 0) {
      conds.push(inArray(requestsTable.skillId, providerSkillIds));
    }

    const rows = await db
      .select()
      .from(requestsTable)
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(requestsTable.createdAt));

    // Optional "nearby" filter: when a reference point and radius are provided,
    // keep located requests inside the radius (km). Requests with no
    // coordinates are always kept so they still reach matching providers.
    const { lat, lng, radiusKm } = q;
    if (lat !== undefined && lng !== undefined && radiusKm !== undefined) {
      const filtered = rows.filter(
        (r) =>
          r.lat === null ||
          r.lng === null ||
          haversineKm(lat, lng, r.lat, r.lng) <= radiusKm,
      );
      res.json(filtered);
      return;
    }
    res.json(rows);
  },
);

router.get(
  "/requests/:id",
  requireUser,
  async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const user = (req as AuthedRequest).dbUser!;
    const [request] = await db
      .select()
      .from(requestsTable)
      .where(eq(requestsTable.id, id))
      .limit(1);
    if (!request) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    // Access control (mirrors GET /requests scoping): the owner and admins can
    // always read a request. A provider may read it when assigned to it, or
    // during discovery when it is still pending and matches one of their skills.
    let allowed = user.role === "admin" || request.userId === user.id;
    if (!allowed) {
      const provider = await getProviderByUserId(user.id);
      if (provider) {
        if (request.providerId === provider.id) {
          allowed = true;
        } else if (request.status === "pending") {
          const [match] = await db
            .select({ skillId: providerSkillsTable.skillId })
            .from(providerSkillsTable)
            .where(
              and(
                eq(providerSkillsTable.providerId, provider.id),
                eq(providerSkillsTable.skillId, request.skillId),
              ),
            )
            .limit(1);
          allowed = !!match;
        }
      }
    }
    if (!allowed) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    res.json(request);
  },
);

router.get(
  "/requests/:id/offers",
  requireUser,
  async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const user = (req as AuthedRequest).dbUser!;
    const [request] = await db
      .select()
      .from(requestsTable)
      .where(eq(requestsTable.id, id))
      .limit(1);
    if (!request) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    // Only the request owner (to choose an offer) or an admin may list the
    // offers competing on a request. Providers see their own offers via
    // GET /offers?mine=true.
    if (user.role !== "admin" && request.userId !== user.id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const rows = await db
      .select()
      .from(offersTable)
      .where(eq(offersTable.requestId, id))
      .orderBy(desc(offersTable.createdAt));
    res.json(rows);
  },
);

/**
 * Reveal the counterparty's contact details (name + phone) — but ONLY after the
 * request has been accepted (assigned to a provider). This is what keeps the
 * marketplace inside the app: providers cannot see the requester's phone while
 * bidding, and the number is exchanged only once a deal is struck.
 *
 * - The request owner receives the assigned provider's contact.
 * - The assigned provider receives the requesting customer's contact.
 * - Anyone else, or before assignment, is denied.
 */
router.get(
  "/requests/:id/contact",
  requireUser,
  async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const user = (req as AuthedRequest).dbUser!;
    const [request] = await db
      .select()
      .from(requestsTable)
      .where(eq(requestsTable.id, id))
      .limit(1);
    if (!request) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    // Contact is only exchanged once the request is accepted (a provider is
    // assigned and the job is live or done) — never during the pending/bidding
    // phase or after cancellation.
    const accepted =
      request.providerId != null &&
      (request.status === "active" ||
        request.status === "in_progress" ||
        request.status === "completed");
    if (!accepted) {
      res
        .status(409)
        .json({ error: "Contact is available after the request is accepted" });
      return;
    }

    const [assignedProvider] = await db
      .select()
      .from(providersTable)
      .where(eq(providersTable.id, request.providerId!))
      .limit(1);
    if (!assignedProvider) {
      res.status(409).json({ error: "Assigned provider not found" });
      return;
    }

    const isOwner = request.userId === user.id;
    const isAssignedProvider = assignedProvider.userId === user.id;
    if (!isOwner && !isAssignedProvider) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    // Owner sees the provider's contact; the provider sees the customer's.
    const targetUserId = isOwner ? assignedProvider.userId : request.userId;
    const targetRole: "customer" | "provider" = isOwner ? "provider" : "customer";
    const [targetUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, targetUserId))
      .limit(1);
    if (!targetUser) {
      res.status(404).json({ error: "Contact not found" });
      return;
    }

    // A provider's phone lives on their onboarding profile (providers.phone);
    // fall back to the account phone (users.phone). A customer only has an
    // account phone.
    const phone = isOwner
      ? assignedProvider.phone ?? targetUser.phone ?? null
      : targetUser.phone ?? null;

    res.json({
      name: targetUser.name,
      phone,
      role: targetRole,
    });
  },
);

router.post(
  "/requests",
  requireUser,
  async (req: Request, res: Response): Promise<void> => {
    const parsed = CreateRequestBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input" });
      return;
    }
    const authed = req as AuthedRequest;
    const user = authed.dbUser!;
    const d = parsed.data;
    // A request must carry at least one piece of media (a photo OR a video);
    // both are allowed. This mirrors the client-side requirement.
    if (!d.imageUrl && !d.videoUrl) {
      res.status(400).json({ error: "An image or a video is required" });
      return;
    }
    const imageUrl = await bindRequestImage(
      d.imageUrl,
      authed.authUserId!,
      authed.log,
    );
    const videoUrl = await bindRequestImage(
      d.videoUrl,
      authed.authUserId!,
      authed.log,
    );
    const [created] = await db
      .insert(requestsTable)
      .values({
        requestNumber: `tmp-${randomUUID()}`,
        userId: user.id,
        skillId: d.skillId,
        description: d.description ?? null,
        imageUrl,
        videoUrl,
        includesSpareParts: d.includesSpareParts ?? false,
        lat: d.lat ?? null,
        lng: d.lng ?? null,
        address: d.address ?? null,
        paymentMethod: d.paymentMethod ?? null,
        priceMin: d.priceMin ?? null,
        priceMax: d.priceMax ?? null,
        preferredTime: d.preferredTime ?? null,
        scheduledTime: d.scheduledTime ?? null,
        status: "pending",
      })
      .returning();
    const requestNumber = `KH-${String(created.id).padStart(5, "0")}`;
    const [updated] = await db
      .update(requestsTable)
      .set({ requestNumber })
      .where(eq(requestsTable.id, created.id))
      .returning();
    // Notify approved providers with matching skills about the new request.
    const [skill] = await db
      .select()
      .from(skillsTable)
      .where(eq(skillsTable.id, updated.skillId))
      .limit(1);
    const skillName = skill?.name ?? "خدمة";
    const matchingProviderIds = await db
      .select({ providerId: providerSkillsTable.providerId })
      .from(providerSkillsTable)
      .where(eq(providerSkillsTable.skillId, updated.skillId));
    const providerIds = matchingProviderIds.map((p) => p.providerId);
    if (providerIds.length) {
      const providers = await db
        .select()
        .from(providersTable)
        .where(
          and(
            inArray(providersTable.id, providerIds),
            eq(providersTable.status, "approved"),
          ),
        );
      if (providers.length) {
        await db.insert(notificationsTable).values(
          providers.map((p) => ({
            userId: p.userId,
            title: "طلب جديد",
            body: `وصلك طلب جديد: ${skillName}`,
            type: "request_new",
            data: { requestId: updated.id },
          })),
        );
      }
    }
    res.status(201).json(updated);
  },
);

router.patch(
  "/requests/:id",
  requireUser,
  async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const parsed = UpdateRequestBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input" });
      return;
    }
    const user = (req as AuthedRequest).dbUser!;
    const [request] = await db
      .select()
      .from(requestsTable)
      .where(eq(requestsTable.id, id))
      .limit(1);
    if (!request) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const isOwner = request.userId === user.id;
    const isAdmin = user.role === "admin";

    // The assigned provider may mark their own active job as completed.
    const provider =
      isOwner || isAdmin ? null : await getProviderByUserId(user.id);
    const isAssignedProvider =
      !!provider && request.providerId === provider.id;

    if (!isOwner && !isAdmin && !isAssignedProvider) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    // The assigned provider may start their active job (active → in_progress)
    // and complete it (active/in_progress → completed). They cannot edit other
    // fields or change arbitrary statuses.
    if (!isOwner && !isAdmin) {
      const from = request.status;
      const to = parsed.data.status;
      const allowed =
        (from === "active" && to === "in_progress") ||
        ((from === "active" || from === "in_progress") && to === "completed");
      if (!allowed || !to) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
    }
    const updateData =
      !isOwner && !isAdmin
        ? { status: parsed.data.status }
        : parsed.data;

    const [updated] = await db
      .update(requestsTable)
      .set(updateData)
      .where(eq(requestsTable.id, id))
      .returning();

    // On completion, record the platform's commission as a debt owed by the
    // assigned provider. Idempotent: a partial unique index guarantees at most
    // one commission entry per request, so onConflictDoNothing makes a
    // retried/duplicate or concurrent PATCH safe — it can never double-charge.
    if (
      parsed.data.status === "completed" &&
      request.status !== "completed" &&
      updated.providerId != null
    ) {
      const gross = updated.priceMax ?? updated.priceMin ?? 0;
      const totals = await getCommissionTotals(updated.providerId);
      const amount = commissionForJob(gross, totals.jobsCount);
      if (amount > 0) {
        await db
          .insert(commissionLedgerTable)
          .values({
            providerId: updated.providerId,
            requestId: updated.id,
            type: "commission",
            amount,
            note: `عمولة الطلب ${updated.requestNumber}`,
          })
          .onConflictDoNothing({
            target: commissionLedgerTable.requestId,
            where: eq(commissionLedgerTable.type, "commission"),
          });
      }
    }

    // Send an event-specific notification for the status transition.
    const newStatus = parsed.data.status;
    if (newStatus && newStatus !== request.status) {
      if (newStatus === "in_progress") {
        await db.insert(notificationsTable).values({
          userId: request.userId,
          title: "بدأ التنفيذ",
          body: `بدأ مقدم الخدمة بتنفيذ طلبك ${request.requestNumber}`,
          type: "request_started",
          data: { requestId: id, status: newStatus },
        });
      } else if (newStatus === "completed") {
        await db.insert(notificationsTable).values({
          userId: request.userId,
          title: "تم إكمال الطلب",
          body: `تم إكمال طلبك ${request.requestNumber}`,
          type: "request_completed",
          data: { requestId: id, status: newStatus },
        });
      } else if (newStatus === "cancelled") {
        if (request.providerId != null) {
          const [pr] = await db
            .select()
            .from(providersTable)
            .where(eq(providersTable.id, request.providerId))
            .limit(1);
          if (pr) {
            await db.insert(notificationsTable).values({
              userId: pr.userId,
              title: "تم إلغاء الطلب",
              body: `ألغى العميل الطلب ${request.requestNumber}`,
              type: "request_cancelled",
              data: { requestId: id, status: newStatus },
            });
          }
        }
      } else {
        await db.insert(notificationsTable).values({
          userId: request.userId,
          title: "تحديث الطلب",
          body: `تم تحديث حالة طلبك ${request.requestNumber}`,
          type: "request_update",
          data: { requestId: id, status: newStatus },
        });
      }
    }
    res.json(updated);
  },
);

export default router;
