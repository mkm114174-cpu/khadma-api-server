import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  providersTable,
  usersTable,
  requestsTable,
  offersTable,
  commissionLedgerTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireRole } from "../lib/auth";
import {
  getCommissionTotals,
  OWED_THRESHOLD,
  COMMISSION_RATE,
  FREE_JOBS_COUNT,
} from "../lib/commission";

const router: IRouter = Router();

/**
 * Admin dashboard analytics — platform revenue, provider performance, totals.
 */
router.get(
  "/admin/analytics",
  requireRole("admin"),
  async (_req: Request, res: Response): Promise<void> => {
    const providers = await db
      .select({
        id: providersTable.id,
        userId: providersTable.userId,
        serviceType: providersTable.serviceType,
        status: providersTable.status,
        rating: providersTable.rating,
        ratingCount: providersTable.ratingCount,
        isAvailable: providersTable.isAvailable,
        city: providersTable.city,
        createdAt: providersTable.createdAt,
        userName: usersTable.name,
        userEmail: usersTable.email,
      })
      .from(providersTable)
      .innerJoin(usersTable, eq(providersTable.userId, usersTable.id));

    const requests = await db.select().from(requestsTable);
    const ledger = await db.select().from(commissionLedgerTable);

    const completed = requests.filter((r) => r.status === "completed");
    const acceptedOffers = await db
      .select({
        offer: offersTable,
        requestId: requestsTable.id,
        providerId: requestsTable.providerId,
      })
      .from(offersTable)
      .innerJoin(requestsTable, eq(offersTable.requestId, requestsTable.id))
      .where(
        and(
          eq(offersTable.status, "accepted"),
          eq(requestsTable.status, "completed"),
        ),
      );

    let grossVolume = 0;
    const grossByProvider = new Map<number, number>();
    for (const row of acceptedOffers) {
      grossVolume += row.offer.price;
      if (row.providerId != null) {
        grossByProvider.set(
          row.providerId,
          (grossByProvider.get(row.providerId) ?? 0) + row.offer.price,
        );
      }
    }

    let totalCommission = 0;
    let totalSettled = 0;
    const commissionByProvider = new Map<
      number,
      { commission: number; settled: number; jobs: number }
    >();
    for (const e of ledger) {
      const cur = commissionByProvider.get(e.providerId) ?? {
        commission: 0,
        settled: 0,
        jobs: 0,
      };
      if (e.type === "commission") {
        cur.commission += e.amount;
        cur.jobs += 1;
        totalCommission += e.amount;
      } else if (e.type === "settlement") {
        cur.settled += e.amount;
        totalSettled += e.amount;
      }
      commissionByProvider.set(e.providerId, cur);
    }

    const providerStats = await Promise.all(
      providers.map(async (p) => {
        const comm = commissionByProvider.get(p.id) ?? {
          commission: 0,
          settled: 0,
          jobs: 0,
        };
        const gross = grossByProvider.get(p.id) ?? 0;
        const owed = comm.commission - comm.settled;
        const totals = await getCommissionTotals(p.id);
        return {
          providerId: p.id,
          name: p.userName ?? null,
          email: p.userEmail ?? null,
          serviceType: p.serviceType,
          status: p.status,
          rating: p.rating,
          ratingCount: p.ratingCount,
          isAvailable: p.isAvailable,
          city: p.city,
          completedJobs: comm.jobs,
          grossEarnings: gross,
          netEarnings: gross - comm.commission,
          platformCommission: comm.commission,
          settled: comm.settled,
          owed,
          blocked: owed > OWED_THRESHOLD,
          freeJobsRemaining: Math.max(0, FREE_JOBS_COUNT - totals.jobsCount),
          createdAt: p.createdAt,
        };
      }),
    );

    providerStats.sort((a, b) => b.grossEarnings - a.grossEarnings);

    const providerByStatus = {
      approved: providers.filter((p) => p.status === "approved").length,
      pending: providers.filter(
        (p) => p.status === "pending" || p.status === "under_review",
      ).length,
      rejected: providers.filter((p) => p.status === "rejected").length,
      needs_info: providers.filter((p) => p.status === "needs_info").length,
    };

    const requestsByStatus = {
      pending: requests.filter((r) => r.status === "pending").length,
      active: requests.filter((r) => r.status === "active").length,
      in_progress: requests.filter((r) => r.status === "in_progress").length,
      completed: completed.length,
      cancelled: requests.filter((r) => r.status === "cancelled").length,
    };

    const recentRequests = [...requests]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 10)
      .map((r) => ({
        id: r.id,
        requestNumber: r.requestNumber,
        description: r.description,
        status: r.status,
        skillId: r.skillId,
        createdAt: r.createdAt,
        scheduledTime: r.scheduledTime,
      }));

    res.json({
      generatedAt: new Date().toISOString(),
      commissionRate: COMMISSION_RATE,
      freeJobsCount: FREE_JOBS_COUNT,
      owedThreshold: OWED_THRESHOLD,
      platform: {
        grossVolume,
        totalCommission,
        totalSettled,
        totalOutstanding: totalCommission - totalSettled,
        providerNetEarnings: grossVolume - totalCommission,
        completedJobs: completed.length,
        totalRequests: requests.length,
        totalProviders: providers.length,
      },
      providerByStatus,
      requestsByStatus,
      providers: providerStats,
      recentRequests,
    });
  },
);

export default router;
