import { db, commissionLedgerTable } from "@workspace/db";
import { eq } from "drizzle-orm";

// Platform commission rate applied to each completed job's gross amount.
export const COMMISSION_RATE = 0.1;

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

/** Commission charged for a completed job, given its gross amount. */
export function commissionForJob(grossAmount: number): number {
  return Math.round(grossAmount * COMMISSION_RATE);
}
