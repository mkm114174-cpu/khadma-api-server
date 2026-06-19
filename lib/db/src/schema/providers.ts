import {
  pgTable,
  text,
  serial,
  integer,
  real,
  boolean,
  doublePrecision,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const providersTable = pgTable("providers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id),
  serviceType: text("service_type"),
  bio: text("bio"),
  experienceYears: integer("experience_years"),
  phone: text("phone"),
  // pending | under_review | needs_info | approved | rejected
  status: text("status").notNull().default("pending"),
  // Residence address (required at the application level for new providers).
  addressText: text("address_text"),
  // Verification documents (private object-storage paths). Temporary: deleted
  // and nulled once the admin makes a final decision (approved/rejected).
  docOsekPaturPath: text("doc_osek_patur_path"),
  docOsekMurshePath: text("doc_osek_murshe_path"),
  docIdPath: text("doc_id_path"),
  // Admin "request more info" message + when it was requested.
  reviewNote: text("review_note"),
  reviewRequestedAt: timestamp("review_requested_at", { withTimezone: true }),
  rating: real("rating").notNull().default(0),
  ratingCount: integer("rating_count").notNull().default(0),
  isAvailable: boolean("is_available").notNull().default(true),
  // Optional availability window stored as "HH:MM" strings.
  availableFrom: text("available_from"),
  availableTo: text("available_to"),
  city: text("city"),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertProviderSchema = createInsertSchema(providersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertProvider = z.infer<typeof insertProviderSchema>;
export type Provider = typeof providersTable.$inferSelect;
