import {
  pgTable,
  text,
  serial,
  timestamp,
  doublePrecision,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  authUserId: text("auth_user_id").notNull().unique(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  // customer | provider | admin
  role: text("role").notNull().default("customer"),
  // Preferred UI language (ar | en | he); used to localize server-sent notifications.
  language: text("language").default("ar"),
  avatarUrl: text("avatar_url"),
  address: text("address"),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  // Presence: updated by a throttled client heartbeat; "online" = recent.
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  // Set when a provider explicitly agrees to the platform commission terms.
  commissionAgreedAt: timestamp("commission_agreed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
