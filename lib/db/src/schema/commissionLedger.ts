import {
  pgTable,
  text,
  serial,
  integer,
  timestamp,
  check,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { providersTable } from "./providers";
import { requestsTable } from "./requests";

export const commissionLedgerTable = pgTable(
  "commission_ledger",
  {
    id: serial("id").primaryKey(),
    providerId: integer("provider_id")
      .notNull()
      .references(() => providersTable.id),
    // The completed job that generated a commission. Null for settlements.
    requestId: integer("request_id").references(() => requestsTable.id),
    // "commission" (provider owes the platform) | "settlement" (provider paid)
    type: text("type").notNull(),
    // Always a positive amount; the sign is implied by `type`.
    amount: integer("amount").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Enforce the valid entry types at the persistence boundary.
    check("commission_ledger_type_check", sql`${table.type} IN ('commission', 'settlement')`),
    // Amounts are always positive; sign is implied by `type`.
    check("commission_ledger_amount_check", sql`${table.amount} > 0`),
    // At most one commission entry per completed job — guarantees idempotent
    // commission recording even under concurrent completion writes.
    uniqueIndex("commission_ledger_request_commission_uq")
      .on(table.requestId)
      .where(sql`${table.type} = 'commission'`),
  ],
);

export const insertCommissionLedgerSchema = createInsertSchema(
  commissionLedgerTable,
).omit({
  id: true,
  createdAt: true,
});
export type InsertCommissionLedger = z.infer<
  typeof insertCommissionLedgerSchema
>;
export type CommissionLedgerEntry = typeof commissionLedgerTable.$inferSelect;
