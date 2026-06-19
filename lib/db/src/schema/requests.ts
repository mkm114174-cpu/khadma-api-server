import {
  pgTable,
  text,
  serial,
  integer,
  doublePrecision,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { providersTable } from "./providers";
import { skillsTable } from "./skills";

export const requestsTable = pgTable("requests", {
  id: serial("id").primaryKey(),
  requestNumber: text("request_number").notNull().unique(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id),
  providerId: integer("provider_id").references(() => providersTable.id),
  skillId: integer("skill_id")
    .notNull()
    .references(() => skillsTable.id),
  description: text("description"),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  // Customer-set flag: the job should include spare parts. Optional, defaults
  // to false. Surfaced to providers so they can price accordingly.
  includesSpareParts: boolean("includes_spare_parts").notNull().default(false),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  address: text("address"),
  // on_site (cash on arrival) | null — customer's chosen payment method
  paymentMethod: text("payment_method"),
  // pending | active | completed | cancelled
  status: text("status").notNull().default("pending"),
  priceMin: integer("price_min"),
  priceMax: integer("price_max"),
  preferredTime: timestamp("preferred_time", { withTimezone: true }),
  scheduledTime: timestamp("scheduled_time", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertRequestSchema = createInsertSchema(requestsTable).omit({
  id: true,
  requestNumber: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertRequest = z.infer<typeof insertRequestSchema>;
export type ServiceRequest = typeof requestsTable.$inferSelect;
