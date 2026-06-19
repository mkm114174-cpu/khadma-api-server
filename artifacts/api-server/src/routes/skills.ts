import { Router, type IRouter, type Request, type Response } from "express";
import { db, skillsTable, providerSkillsTable, providersTable } from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";
import {
  requireUser,
  requireRole,
  getProviderByUserId,
  getClerkUserId,
  loadDbUserByClerkId,
  type AuthedRequest,
} from "../lib/auth";
import { ObjectStorageService } from "../lib/objectStorage";

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

// The 13 customer-facing sections a service may be assigned to. Admin chooses
// from these only — no new sections can be created. Mirrors the admin UI list.
const ALLOWED_SECTIONS = new Set<string>([
  "painting",
  "plumbing",
  "electricity",
  "cleaning",
  "ac",
  "carpentry",
  "cars",
  "appliances",
  "pest_control",
  "furniture",
  "landscaping",
  "moving",
  "other",
]);

// Link the proposing provider to a skill (idempotent — no unique constraint exists).
async function ensureProviderSkillLink(userId: number, skillId: number): Promise<void> {
  const provider = await getProviderByUserId(userId);
  if (!provider) return;
  const existing = await db
    .select()
    .from(providerSkillsTable)
    .where(
      and(
        eq(providerSkillsTable.providerId, provider.id),
        eq(providerSkillsTable.skillId, skillId),
      ),
    )
    .limit(1);
  if (existing.length === 0) {
    await db.insert(providerSkillsTable).values({ providerId: provider.id, skillId });
  }
}

// GET /skills — list skills.
// Defaults to approved-only (what customers and provider onboarding should see).
// Admin can pass ?status=pending | rejected | all to review proposals.
router.get("/skills", async (req: Request, res: Response): Promise<void> => {
  const typeFilter = req.query.type as string | undefined;
  const categoryFilter = req.query.category as string | undefined;
  const statusFilter = (req.query.status as string | undefined) ?? "approved";

  // Non-approved statuses (pending/rejected/all) are admin-only review views.
  if (statusFilter !== "approved") {
    const clerkUserId = getClerkUserId(req);
    const user = clerkUserId ? await loadDbUserByClerkId(clerkUserId) : null;
    if (!user || user.role !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
  }

  const conds = [];
  if (typeFilter && typeFilter !== "all") {
    conds.push(eq(skillsTable.type, typeFilter));
  }
  if (categoryFilter) {
    conds.push(eq(skillsTable.category, categoryFilter));
  }
  if (statusFilter && statusFilter !== "all") {
    conds.push(eq(skillsTable.status, statusFilter));
  }

  const rows = await db.select().from(skillsTable).where(conds.length > 0 ? and(...conds) : undefined);
  res.json(rows);
});

// POST /skills — provider proposes a new (custom) skill. Starts as pending.
// Restricted to providers (role check, not an existing provider row, since new
// providers propose skills during onboarding before their profile is created)
// and admins. Customers must not be able to propose services.
router.post(
  "/skills",
  requireRole("provider", "admin"),
  async (req: Request, res: Response): Promise<void> => {
  const { name, slug, category, icon, color } = req.body;
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    res.status(400).json({ error: "Name is required" });
    return;
  }
  if (!slug || typeof slug !== "string" || slug.trim().length === 0) {
    res.status(400).json({ error: "Slug is required" });
    return;
  }
  if (category != null && (typeof category !== "string" || !ALLOWED_SECTIONS.has(category))) {
    res.status(400).json({ error: "Invalid category" });
    return;
  }

  // Check for duplicate slug
  const existing = await db.select().from(skillsTable).where(eq(skillsTable.slug, slug.trim())).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "Skill already exists" });
    return;
  }

  const user = (req as AuthedRequest).dbUser!;
  const [created] = await db
    .insert(skillsTable)
    .values({
      name: name.trim(),
      slug: slug.trim(),
      category: category ?? null,
      icon: icon ?? null,
      color: color ?? null,
      type: "custom",
      status: "pending",
      createdByUserId: user.id,
    })
    .returning();

  // Link the proposing provider so the service stays attached once approved.
  await ensureProviderSkillLink(user.id, created.id);

  res.status(201).json(created);
});

// GET /skills/:id
router.get("/skills/:id", async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [skill] = await db.select().from(skillsTable).where(eq(skillsTable.id, id)).limit(1);
  if (!skill) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  // Only approved skills are public. Pending/rejected detail is admin-only.
  if (skill.status !== "approved") {
    const clerkUserId = getClerkUserId(req);
    const user = clerkUserId ? await loadDbUserByClerkId(clerkUserId) : null;
    if (!user || user.role !== "admin") {
      res.status(404).json({ error: "Not found" });
      return;
    }
  }
  res.json(skill);
});

// PATCH /skills/:id — admin reviews/edits a skill (rename, translate, assign
// section, attach image, approve/reject).
router.patch(
  "/skills/:id",
  requireRole("admin"),
  async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const [skill] = await db.select().from(skillsTable).where(eq(skillsTable.id, id)).limit(1);
    if (!skill) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const b = req.body ?? {};
    const update: Record<string, unknown> = {};
    const stringFields = [
      "name",
      "nameEn",
      "nameHe",
      "description",
      "descriptionEn",
      "descriptionHe",
      "category",
      "icon",
      "color",
      "image",
    ];
    for (const f of stringFields) {
      if (f in b) {
        const v = b[f];
        update[f] = typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
      }
    }
    if ("status" in b) {
      const s = b.status;
      if (!["pending", "approved", "rejected"].includes(s)) {
        res.status(400).json({ error: "Invalid status" });
        return;
      }
      update.status = s;
    }
    if (typeof b.name === "string" && b.name.trim().length === 0) {
      res.status(400).json({ error: "Name cannot be empty" });
      return;
    }
    if (typeof update.category === "string" && !ALLOWED_SECTIONS.has(update.category)) {
      res.status(400).json({ error: "Invalid category" });
      return;
    }

    if (Object.keys(update).length === 0) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }

    // Make an attached image publicly readable so customers can load it.
    if (typeof update.image === "string" && update.image.length > 0) {
      const adminClerkId = (req as AuthedRequest).clerkUserId!;
      try {
        await objectStorageService.trySetObjectEntityAclPolicy(update.image as string, {
          owner: adminClerkId,
          visibility: "public",
        });
      } catch (err) {
        req.log.warn({ err, image: update.image }, "Failed to set ACL on skill image");
      }
    }

    const [updated] = await db
      .update(skillsTable)
      .set(update)
      .where(eq(skillsTable.id, id))
      .returning();

    // On approval, make sure the proposing provider is linked.
    if (update.status === "approved" && updated.createdByUserId) {
      await ensureProviderSkillLink(updated.createdByUserId, updated.id);
    }

    res.json(updated);
  },
);

// DELETE /skills/:id — admin removes a skill.
router.delete(
  "/skills/:id",
  requireRole("admin"),
  async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const [skill] = await db.select().from(skillsTable).where(eq(skillsTable.id, id)).limit(1);
    if (!skill) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    await db.delete(skillsTable).where(eq(skillsTable.id, id));
    res.status(204).end();
  },
);

// GET /provider-skills — list skills for current provider
router.get("/provider-skills", requireUser, async (req: Request, res: Response): Promise<void> => {
  const user = (req as AuthedRequest).dbUser!;
  const provider = await getProviderByUserId(user.id);
  if (!provider) {
    res.status(404).json({ error: "No provider profile" });
    return;
  }
  const rows = await db
    .select()
    .from(providerSkillsTable)
    .where(eq(providerSkillsTable.providerId, provider.id));
  // Fetch skill details for each
  const skillIds = rows.map((r) => r.skillId);
  const skillsMap = new Map<number, typeof skillsTable.$inferSelect>();
  if (skillIds.length > 0) {
    const skills = await db.select().from(skillsTable).where(inArray(skillsTable.id, skillIds));
    for (const s of skills) {
      skillsMap.set(s.id, s);
    }
  }
  const enriched = rows.map((r) => ({
    ...r,
    skill: skillsMap.get(r.skillId) ?? null,
  }));
  res.json(enriched);
});

// POST /provider-skills — set skills for current provider (replaces all)
router.post("/provider-skills", requireUser, async (req: Request, res: Response): Promise<void> => {
  const user = (req as AuthedRequest).dbUser!;
  const provider = await getProviderByUserId(user.id);
  if (!provider) {
    res.status(404).json({ error: "No provider profile" });
    return;
  }
  const { skillIds } = req.body;
  if (!Array.isArray(skillIds)) {
    res.status(400).json({ error: "skillIds array is required" });
    return;
  }

  // Remove existing skills for this provider
  await db
    .delete(providerSkillsTable)
    .where(eq(providerSkillsTable.providerId, provider.id));

  // Insert new ones
  if (skillIds.length > 0) {
    await db.insert(providerSkillsTable).values(
      skillIds.map((skillId: number) => ({
        providerId: provider.id,
        skillId,
      })),
    );
  }

  // Return enriched
  const rows = await db
    .select()
    .from(providerSkillsTable)
    .where(eq(providerSkillsTable.providerId, provider.id));
  const skillIdsList = rows.map((r) => r.skillId);
  const skillsMap = new Map<number, typeof skillsTable.$inferSelect>();
  if (skillIdsList.length > 0) {
    const skills = await db.select().from(skillsTable).where(inArray(skillsTable.id, skillIdsList));
    for (const s of skills) {
      skillsMap.set(s.id, s);
    }
  }
  const enriched = rows.map((r) => ({
    ...r,
    skill: skillsMap.get(r.skillId) ?? null,
  }));
  res.json(enriched);
});

export default router;
