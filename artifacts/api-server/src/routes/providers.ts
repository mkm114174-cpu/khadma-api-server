import { Router, type IRouter, type Request, type Response } from "express";
import { Readable } from "stream";
import {
  db,
  providersTable,
  usersTable,
  notificationsTable,
  skillsTable,
  providerSkillsTable,
} from "@workspace/db";
import { and, eq, getTableColumns } from "drizzle-orm";
import {
  CreateProviderBody,
  UpdateProviderBody,
  ListProvidersQueryParams,
  RequestProviderInfoBody,
} from "@workspace/api-zod";
import {
  requireUser,
  getProviderByUserId,
  getAuthUserId,
  loadDbUserByAuthId,
  type AuthedRequest,
} from "../lib/auth";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

// Maps the public `kind` path param to the provider document column.
const DOC_COLUMNS = {
  osek_patur: "docOsekPaturPath",
  osek_murshe: "docOsekMurshePath",
  id: "docIdPath",
} as const;
type DocKind = keyof typeof DOC_COLUMNS;

type NotifLang = "ar" | "en" | "he";

// Normalize a stored language value to a supported notification language.
function resolveLang(value: string | null | undefined): NotifLang {
  return value === "en" || value === "he" ? value : "ar";
}

// Localized copy for the in-app notification sent on a final review decision.
const REVIEW_NOTIFICATION: Record<
  "approved" | "rejected",
  Record<NotifLang, { title: string; body: string }>
> = {
  approved: {
    ar: {
      title: "تم قبول طلبك 🎉",
      body: "مرحباً بك في خدمة! تمّت الموافقة على طلب انضمامك كمزوّد خدمة. يمكنك الآن استقبال الطلبات وتقديم خدماتك للعملاء. نتمنّى لك التوفيق.",
    },
    en: {
      title: "Your application was approved 🎉",
      body: "Welcome to Khadma! Your provider application has been approved. You can now receive requests and offer your services to customers. We wish you great success.",
    },
    he: {
      title: "הבקשה שלך אושרה 🎉",
      body: "ברוך הבא ל-Khadma! בקשתך כספק שירות אושרה. כעת תוכל לקבל בקשות ולהציע את שירותיך ללקוחות. בהצלחה!",
    },
  },
  rejected: {
    ar: {
      title: "بخصوص طلب انضمامك",
      body: "نأسف لإبلاغك بأنه لم تتم الموافقة على طلب انضمامك كمزوّد خدمة في الوقت الحالي. نقدّر اهتمامك ونشكرك على وقتك.",
    },
    en: {
      title: "About your application",
      body: "We're sorry to let you know that your provider application has not been approved at this time. We appreciate your interest and thank you for your time.",
    },
    he: {
      title: "בנוגע לבקשתך",
      body: "אנו מצטערים להודיע לך שבקשתך כספק שירות לא אושרה בשלב זה. אנו מעריכים את התעניינותך ומודים לך על זמנך.",
    },
  },
};

// Prefix for the optional admin-written rejection reason.
const REJECTION_REASON_LABEL: Record<NotifLang, string> = {
  ar: "السبب: ",
  en: "Reason: ",
  he: "סיבה: ",
};

// Bind a freshly-uploaded document to the provider applicant: private
// visibility, owned by the uploading Clerk user. Only `/objects/` paths are
// accepted — anything else is rejected to prevent ACL-binding arbitrary paths.
async function bindProviderDoc(
  rawPath: string,
  ownerAuthUserId: string,
): Promise<string> {
  if (!rawPath.startsWith("/objects/")) {
    throw new ObjectNotFoundError();
  }
  return objectStorageService.trySetObjectEntityAclPolicy(rawPath, {
    owner: ownerAuthUserId,
    visibility: "private",
  });
}

router.get("/providers", async (req: Request, res: Response): Promise<void> => {
  const parsed = ListProvidersQueryParams.safeParse(req.query);
  const q = parsed.success ? parsed.data : {};
  const requestedStatus = q.status ?? "approved";
  const authUserId = await getAuthUserId(req);
  const viewer = authUserId ? await loadDbUserByAuthId(authUserId) : null;
  const isAdmin = viewer?.role === "admin";
  // Only approved providers are public. Listing applicants (pending /
  // under_review / needs_info / rejected) exposes private application data, so
  // require admin.
  if (requestedStatus !== "approved" && !isAdmin) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const conds = [];
  conds.push(eq(providersTable.status, requestedStatus));
  if (q.serviceType) conds.push(eq(providersTable.serviceType, q.serviceType));
  const rows = await db
    .select({ ...getTableColumns(providersTable), name: usersTable.name })
    .from(providersTable)
    .innerJoin(usersTable, eq(providersTable.userId, usersTable.id))
    .where(and(...conds));
  // A provider's phone is private contact info. It is exposed only to admins
  // (for review) and to the assigned customer post-acceptance via
  // /requests/:id/contact — never in the public discovery list.
  res.json(isAdmin ? rows : rows.map((r) => ({ ...r, phone: null })));
});

router.get(
  "/providers/me",
  requireUser,
  async (req: Request, res: Response): Promise<void> => {
    const user = (req as AuthedRequest).dbUser!;
    const provider = await getProviderByUserId(user.id);
    if (!provider) {
      res.status(404).json({ error: "No provider profile" });
      return;
    }
    res.json(provider);
  },
);

router.get(
  "/providers/:id",
  async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const [provider] = await db
      .select({ ...getTableColumns(providersTable), name: usersTable.name })
      .from(providersTable)
      .innerJoin(usersTable, eq(providersTable.userId, usersTable.id))
      .where(eq(providersTable.id, id))
      .limit(1);
    if (!provider) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const authUserId = await getAuthUserId(req);
    const viewer = authUserId ? await loadDbUserByAuthId(authUserId) : null;
    const isAdmin = viewer?.role === "admin";
    const isOwner = viewer?.id === provider.userId;
    // Only approved providers are public. Fetching an applicant (pending /
    // under_review / needs_info / rejected) by id exposes private identity data,
    // so require admin or the owner.
    if (provider.status !== "approved" && !isAdmin && !isOwner) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    // Phone is private contact info — only the owner and admins may read it
    // here; customers obtain it post-acceptance via /requests/:id/contact.
    res.json(isAdmin || isOwner ? provider : { ...provider, phone: null });
  },
);

router.post(
  "/providers",
  requireUser,
  async (req: Request, res: Response): Promise<void> => {
    const parsed = CreateProviderBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input" });
      return;
    }
    const user = (req as AuthedRequest).dbUser!;
    const authUserId = (req as AuthedRequest).authUserId!;
    const existing = await getProviderByUserId(user.id);
    if (existing) {
      res.status(409).json({ error: "Provider profile already exists" });
      return;
    }
    const {
      serviceType,
      bio,
      experienceYears,
      phone,
      city,
      addressText,
      docOsekPaturPath,
      docOsekMurshePath,
      docIdPath,
      lat,
      lng,
    } = parsed.data;
    if (experienceYears !== undefined && !Number.isInteger(experienceYears)) {
      res.status(400).json({ error: "Invalid input" });
      return;
    }

    let paturPath: string;
    let idPath: string;
    let murshePath: string | null = null;
    try {
      paturPath = await bindProviderDoc(docOsekPaturPath, authUserId);
      idPath = await bindProviderDoc(docIdPath, authUserId);
      if (docOsekMurshePath) {
        murshePath = await bindProviderDoc(docOsekMurshePath, authUserId);
      }
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        res.status(400).json({ error: "Document upload not found" });
        return;
      }
      req.log.error({ err: error }, "Error binding provider documents");
      res.status(500).json({ error: "Failed to attach documents" });
      return;
    }

    const [created] = await db
      .insert(providersTable)
      .values({
        userId: user.id,
        serviceType: serviceType ?? null,
        bio: bio ?? null,
        experienceYears: experienceYears ?? null,
        phone: phone ?? null,
        city: city ?? null,
        addressText: addressText ?? null,
        docOsekPaturPath: paturPath,
        docOsekMurshePath: murshePath,
        docIdPath: idPath,
        lat: lat ?? null,
        lng: lng ?? null,
        status: "pending",
      })
      .returning();
    res.status(201).json(created);
  },
);

router.patch(
  "/providers/:id",
  requireUser,
  async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const parsed = UpdateProviderBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input" });
      return;
    }
    const user = (req as AuthedRequest).dbUser!;
    const authUserId = (req as AuthedRequest).authUserId!;
    const [provider] = await db
      .select()
      .from(providersTable)
      .where(eq(providersTable.id, id))
      .limit(1);
    if (!provider) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const isOwner = provider.userId === user.id;
    const isAdmin = user.role === "admin";
    if (!isOwner && !isAdmin) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    if (
      parsed.data.experienceYears !== undefined &&
      !Number.isInteger(parsed.data.experienceYears)
    ) {
      res.status(400).json({ error: "Invalid input" });
      return;
    }
    // Doc-path fields are managed only via the owner's resubmission flow.
    // `reviewNote` is pulled out so it is never blindly applied: admins only use
    // it to carry an optional rejection reason into the notification below.
    const {
      status,
      reviewNote,
      docOsekPaturPath,
      docOsekMurshePath,
      docIdPath,
      ...rest
    } = parsed.data;
    const updates: Record<string, unknown> = { ...rest };
    // Files to remove from object storage after the DB row is updated.
    const filesToDelete: Array<string | null | undefined> = [];

    // Owner resubmission: rebind any provided documents, delete the replaced
    // ones, and (if applicant was asked for more info) move back to pending.
    if (isOwner) {
      try {
        if (docOsekPaturPath !== undefined) {
          updates.docOsekPaturPath = await bindProviderDoc(
            docOsekPaturPath,
            authUserId,
          );
          if (
            provider.docOsekPaturPath &&
            provider.docOsekPaturPath !== updates.docOsekPaturPath
          ) {
            filesToDelete.push(provider.docOsekPaturPath);
          }
        }
        if (docIdPath !== undefined) {
          updates.docIdPath = await bindProviderDoc(docIdPath, authUserId);
          if (provider.docIdPath && provider.docIdPath !== updates.docIdPath) {
            filesToDelete.push(provider.docIdPath);
          }
        }
        if (docOsekMurshePath !== undefined && docOsekMurshePath !== null) {
          updates.docOsekMurshePath = await bindProviderDoc(
            docOsekMurshePath,
            authUserId,
          );
          if (
            provider.docOsekMurshePath &&
            provider.docOsekMurshePath !== updates.docOsekMurshePath
          ) {
            filesToDelete.push(provider.docOsekMurshePath);
          }
        }
      } catch (error) {
        if (error instanceof ObjectNotFoundError) {
          res.status(400).json({ error: "Document upload not found" });
          return;
        }
        req.log.error({ err: error }, "Error binding provider documents");
        res.status(500).json({ error: "Failed to attach documents" });
        return;
      }

      const resubmitted =
        docOsekPaturPath !== undefined ||
        docIdPath !== undefined ||
        docOsekMurshePath !== undefined ||
        rest.addressText !== undefined;
      if (provider.status === "needs_info" && resubmitted) {
        updates.status = "pending";
        updates.reviewNote = null;
        updates.reviewRequestedAt = null;
      }
    }

    // Only admins may change approval status.
    if (status !== undefined) {
      if (!isAdmin) {
        res.status(403).json({ error: "Only admins can change status" });
        return;
      }
      updates.status = status;
      // On a final decision, verification documents are no longer needed —
      // delete the files and clear the columns + review metadata.
      if (status === "approved" || status === "rejected") {
        filesToDelete.push(
          provider.docOsekPaturPath,
          provider.docOsekMurshePath,
          provider.docIdPath,
        );
        updates.docOsekPaturPath = null;
        updates.docOsekMurshePath = null;
        updates.docIdPath = null;
        updates.reviewNote = null;
        updates.reviewRequestedAt = null;
      }
    }

    const [updated] = await db
      .update(providersTable)
      .set(updates)
      .where(eq(providersTable.id, id))
      .returning();

    // On approval, auto-enable the catch-all "other-general" skill so the
    // provider starts receiving "أخرى" (other) requests by default. They can
    // turn it off later from their skills settings, so we only add it when it's
    // not already present (never re-add over a deliberate opt-out via this path).
    if (isAdmin && status === "approved") {
      try {
        const [otherSkill] = await db
          .select()
          .from(skillsTable)
          .where(eq(skillsTable.slug, "other-general"))
          .limit(1);
        if (otherSkill) {
          const [already] = await db
            .select()
            .from(providerSkillsTable)
            .where(
              and(
                eq(providerSkillsTable.providerId, id),
                eq(providerSkillsTable.skillId, otherSkill.id),
              ),
            )
            .limit(1);
          if (!already) {
            await db
              .insert(providerSkillsTable)
              .values({ providerId: id, skillId: otherSkill.id });
          }
        }
      } catch (error) {
        req.log.warn(
          { err: error },
          "Failed to auto-enable other-general skill on approval",
        );
      }
    }

    // Best-effort cleanup; never fail the request because a file is already gone.
    for (const path of filesToDelete) {
      if (!path) continue;
      try {
        await objectStorageService.deleteObjectEntity(path);
      } catch (error) {
        req.log.warn({ err: error }, "Failed to delete provider document");
      }
    }

    // On a final admin decision, notify the provider in-app, localized to their
    // preferred language. Best-effort: never fail the request on a notify error.
    if (isAdmin && (status === "approved" || status === "rejected")) {
      try {
        const [target] = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.id, provider.userId))
          .limit(1);
        const lang = resolveLang(target?.language);
        const copy = REVIEW_NOTIFICATION[status][lang];
        const reason = typeof reviewNote === "string" ? reviewNote.trim() : "";
        const body =
          status === "rejected" && reason
            ? `${copy.body}\n\n${REJECTION_REASON_LABEL[lang]}${reason}`
            : copy.body;
        await db.insert(notificationsTable).values({
          userId: provider.userId,
          title: copy.title,
          body,
          type: "provider_review",
          data: { providerId: id, kind: status },
        });
      } catch (error) {
        req.log.warn(
          { err: error },
          "Failed to insert provider review notification",
        );
      }
    }

    res.json(updated);
  },
);

router.post(
  "/providers/:id/request-info",
  requireUser,
  async (req: Request, res: Response): Promise<void> => {
    const user = (req as AuthedRequest).dbUser!;
    if (user.role !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const parsed = RequestProviderInfoBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input" });
      return;
    }
    const [provider] = await db
      .select()
      .from(providersTable)
      .where(eq(providersTable.id, id))
      .limit(1);
    if (!provider) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const [updated] = await db
      .update(providersTable)
      .set({
        status: "needs_info",
        reviewNote: parsed.data.message,
        reviewRequestedAt: new Date(),
      })
      .where(eq(providersTable.id, id))
      .returning();

    await db.insert(notificationsTable).values({
      userId: provider.userId,
      title: "مطلوب معلومات إضافية",
      body: parsed.data.message,
      type: "provider_review",
      data: { providerId: id, kind: "needs_info" },
    });

    res.json(updated);
  },
);

router.get(
  "/providers/:id/documents/:kind",
  requireUser,
  async (req: Request, res: Response): Promise<void> => {
    const user = (req as AuthedRequest).dbUser!;
    if (user.role !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const kind = req.params.kind as DocKind;
    const column = DOC_COLUMNS[kind];
    if (!column) {
      res.status(400).json({ error: "Invalid document kind" });
      return;
    }
    const [provider] = await db
      .select()
      .from(providersTable)
      .where(eq(providersTable.id, id))
      .limit(1);
    if (!provider) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const objectPath = provider[column];
    if (!objectPath) {
      res.status(404).json({ error: "Document not found" });
      return;
    }
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
      const response = await objectStorageService.downloadObject(objectFile);
      res.status(response.status);
      response.headers.forEach((value, key) => res.setHeader(key, value));
      // Verification documents are sensitive and short-lived — never cache.
      res.setHeader("Cache-Control", "private, no-store");
      if (response.body) {
        const nodeStream = Readable.fromWeb(
          response.body as ReadableStream<Uint8Array>,
        );
        nodeStream.pipe(res);
      } else {
        res.end();
      }
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        res.status(404).json({ error: "Document not found" });
        return;
      }
      req.log.error({ err: error }, "Error serving provider document");
      res.status(500).json({ error: "Failed to serve document" });
    }
  },
);

export default router;
