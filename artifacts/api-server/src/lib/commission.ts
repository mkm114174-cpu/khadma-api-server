import { db, commissionLedgerTable } from "@workspace/db";
import { eq } from "drizzle-orm";

// Platform commission rate applied to each completed job's gross amount.
export const COMMISSION_RATE = 0.07;

// First N completed jobs are commission-free for new providers.
export const FREE_JOBS_COUNT = 5;

// When a provider's outstanding commission debt exceeds this amount, they are
// blocked from taking on new jobs until they settle.
export const OWED_THRESHOLD = 500;

export interface CommissionTotals {
  totalCommission: number;
  totalSettled: number;
  owed: number;
  jobsCount: number;
}

/**
 * Compute a provider's commission totals from their ledger entries.
 * `owed` = sum(commission) - sum(settlement); `jobsCount` counts commission
 * entries (one per completed job).
 */
export async function getCommissionTotals(
  providerId: number,
): Promise<CommissionTotals> {
  const rows = await db
    .select()
    .from(commissionLedgerTable)
    .where(eq(commissionLedgerTable.providerId, providerId));
  let totalCommission = 0;
  let totalSettled = 0;
  let jobsCount = 0;
  for (const r of rows) {
    if (r.type === "commission") {
      totalCommission += r.amount;
      jobsCount += 1;
    } else if (r.type === "settlement") {
      totalSettled += r.amount;
    }
  }
  return {
    totalCommission,
    totalSettled,
    owed: totalCommission - totalSettled,
    jobsCount,
  };
}

/** Convenience: a provider's current outstanding commission debt. */
export async function getCommissionOwed(providerId: number): Promise<number> {
  const { owed } = await getCommissionTotals(providerId);
  return owed;
}

/** Commission charged for a completed job, given its gross amount and prior job count. */
export function commissionForJob(
  grossAmount: number,
  completedJobsBefore = 0,
): number {
  if (completedJobsBefore < FREE_JOBS_COUNT) return 0;
  return Math.round(grossAmount * COMMISSION_RATE);
}
