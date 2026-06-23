import {
  db,
  requestsTable,
  offersTable,
  notificationsTable,
  providersTable,
  providerSkillsTable,
  skillsTable,
} from "@workspace/db";
import { and, eq, inArray } from "drizzle-orm";
import { logger } from "./logger";
import { isProviderAvailableNow } from "./availability";

/**
 * Auto-reassign sweep.
 *
 * The marketplace uses a broadcast model: a new request notifies every approved
 * provider that offers the matching service, and the customer then picks an
 * offer. If a request sits in "pending" with NO offers for too long it is
 * effectively stuck — the first providers may be offline or ignored it.
 *
 * This sweep periodically finds pending requests that received no offers within
 * a timeout window and re-broadcasts them to the currently AVAILABLE matching
 * providers (escalation). Each request is escalated at most once per window so
 * providers are not spammed. Tracking is in-memory (resets on restart), which
 * is fine: a restart simply allows a fresh escalation.
 */

const TIMEOUT_MS = 3 * 60 * 1000; // re-broadcast a request with no offers after 3 minutes
const SWEEP_INTERVAL_MS = 60 * 1000; // check once a minute
const RE_ESCALATE_MS = 10 * 60 * 1000; // allow escalating the same request again after 10 min

// requestId -> last escalation timestamp (ms)
const lastEscalated = new Map<number, number>();

async function sweepOnce(now = Date.now()): Promise<void> {
  // Pending, unassigned requests.
  const pending = await db
    .select()
    .from(requestsTable)
    .where(eq(requestsTable.status, "pending"));

  const stale = pending.filter((r) => {
    if (r.providerId != null) return false;
    const age = now - new Date(r.createdAt).getTime();
    if (age < TIMEOUT_MS) return false;
    const last = lastEscalated.get(r.id);
    if (last != null && now - last < RE_ESCALATE_MS) return false;
    return true;
  });
  if (!stale.length) return;

  const staleIds = stale.map((r) => r.id);

  // Which of these already have at least one offer? Those are NOT stuck.
  const offers = await db
    .select({ requestId: offersTable.requestId })
    .from(offersTable)
    .where(inArray(offersTable.requestId, staleIds));
  const hasOffer = new Set(offers.map((o) => o.requestId));

  for (const reqRow of stale) {
    if (hasOffer.has(reqRow.id)) {
      // It got an offer; stop tracking it.
      lastEscalated.delete(reqRow.id);
      continue;
    }

    // Approved providers with matching skill who are available right now.
    const matchingProviderIds = await db
      .select({ providerId: providerSkillsTable.providerId })
      .from(providerSkillsTable)
      .where(eq(providerSkillsTable.skillId, reqRow.skillId));
    const providerIds = matchingProviderIds.map((p) => p.providerId);
    if (!providerIds.length) continue;
    const matching = await db
      .select()
      .from(providersTable)
      .where(
        and(
          inArray(providersTable.id, providerIds),
          eq(providersTable.status, "approved"),
        ),
      );
    const available = matching.filter((p) => isProviderAvailableNow(p));
    if (!available.length) continue;

    await db.insert(notificationsTable).values(
      available.map((p) => ({
        userId: p.userId,
        title: "طلب بانتظار مزود",
        body: `طلب لم يُقبل بعد ويحتاج مزوداً`,
        type: "request_reassigned",
        data: { requestId: reqRow.id, reassigned: true },
      })),
    );
    lastEscalated.set(reqRow.id, now);
    logger.info(
      { requestId: reqRow.id, providers: available.length },
      "Re-broadcast stale request to available providers",
    );
  }
}

export function startReassignSweep(): void {
  setInterval(() => {
    sweepOnce().catch((err) => {
      logger.error({ err }, "Auto-reassign sweep failed");
    });
  }, SWEEP_INTERVAL_MS);
  logger.info("Auto-reassign sweep started");
}
