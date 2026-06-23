import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  commissionLedgerTable,
  providersTable,
  usersTable,
} from "@workspace/db";
import { desc, eq, getTableColumns } from "drizzle-orm";
import { requireUser, requireRole, type AuthedRequest } from "../lib/auth";
import {
  getCommissionTotals,
  FREE_JOBS_COUNT,
  OWED_THRESHOLD,
} from "../lib/commission";

const router: IRouter = Router();

// Provider: own commission balance summary.
router.get(
  "/commission/me",
  requireUser,
  async (req: Request, res: Response): Promise<void> => {
    const user = (req as AuthedRequest).dbUser!;
    const [provider] = await db
      .select()
      .from(providersTable)
      .where(eq(providersTable.userId, user.id))
      .limit(1);
    if (!provider) {
      res.status(404).json({ error: "No provider profile" });
      return;
    }
    const totals = await getCommissionTotals(provider.id);
    res.json({
      owed: totals.owed,
      totalCommission: totals.totalCommission,
      totalSettled: totals.totalSettled,
      threshold: OWED_THRESHOLD,
      blocked: totals.owed > OWED_THRESHOLD,
      jobsCount: totals.jobsCount,
      freeJobsTotal: FREE_JOBS_COUNT,
      freeJobsRemaining: Math.max(0, FREE_JOBS_COUNT - totals.jobsCount),
    });
  },
);

// Provider: own commission ledger entries.
router.get(
  "/commission/me/entries",
  requireUser,
  async (req: Request, res: Response): Promise<void> => {
    const user = (req as AuthedRequest).dbUser!;
    const [provider] = await db
      .select()
      .from(providersTable)
      .where(eq(providersTable.userId, user.id))
      .limit(1);
    if (!provider) {
      res.status(404).json({ error: "No provider profile" });
      return;
    }
    const rows = await db
      .select()
      .from(commissionLedgerTable)
      .where(eq(commissionLedgerTable.providerId, provider.id))
      .orderBy(desc(commissionLedgerTable.createdAt));
    res.json(rows);
  },
);

// Admin: platform commission overview with per-provider balances.
router.get(
  "/commission/admin",
  requireRole("admin"),
  async (_req: Request, res: Response): Promise<void> => {
    const providers = await db
      .select({ ...getTableColumns(providersTable), name: usersTable.name })
      .from(providersTable)
      .innerJoin(usersTable, eq(providersTable.userId, usersTable.id));
    const ledger = await db.select().from(commissionLedgerTable);

    const byProvider = new Map<
      number,
      { commission: number; settled: number; jobs: number }
    >();
    for (const e of ledger) {
      const cur = byProvider.get(e.providerId) ?? {
        commission: 0,
        settled: 0,
        jobs: 0,
      };
      if (e.type === "commission") {
        cur.commission += e.amount;
        cur.jobs += 1;
      } else if (e.type === "settlement") {
        cur.settled += e.amount;
      }
      byProvider.set(e.providerId, cur);
    }

    let totalCommission = 0;
    let totalSettled = 0;
    const rows = providers
      .map((p) => {
        const t = byProvider.get(p.id) ?? {
          commission: 0,
          settled: 0,
          jobs: 0,
        };
        totalCommission += t.commission;
        totalSettled += t.settled;
        const owed = t.commission - t.settled;
        return {
          providerId: p.id,
          name: p.name ?? null,
          serviceType: p.serviceType,
          status: p.status,
          owed,
          totalCommission: t.commission,
          totalSettled: t.settled,
          jobsCount: t.jobs,
          blocked: owed > OWED_THRESHOLD,
        };
      })
      // Surface providers with activity first, highest debt at the top.
      .filter((r) => r.totalCommission > 0 || r.totalSettled > 0)
      .sort((a, b) => b.owed - a.owed);

    res.json({
      totalCommission,
      totalSettled,
      totalOutstanding: totalCommission - totalSettled,
      threshold: OWED_THRESHOLD,
      providers: rows,
    });
  },
);

// Admin: record a settlement payment against a provider's commission debt.
router.post(
  "/commission/admin/settlements",
  requireRole("admin"),
  async (req: Request, res: Response): Promise<void> => {
    const providerId = Number(req.body?.providerId);
    const amount = Number(req.body?.amount);
    const note =
      typeof req.body?.note === "string" ? req.body.note : null;
    if (
      !Number.isInteger(providerId) ||
      !Number.isInteger(amount) ||
      amount < 1
    ) {
      res.status(400).json({ error: "Invalid input" });
      return;
    }
    const [provider] = await db
      .select()
      .from(providersTable)
      .where(eq(providersTable.id, providerId))
      .limit(1);
    if (!provider) {
      res.status(400).json({ error: "Provider not found" });
      return;
    }
    const [created] = await db
      .insert(commissionLedgerTable)
      .values({
        providerId,
        requestId: null,
        type: "settlement",
        amount,
        note: note ?? "تسوية عمولة",
      })
      .returning();
    res.status(201).json(created);
  },
);

export default router;
