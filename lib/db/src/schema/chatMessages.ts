import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { requestsTable } from "./requests";
import { providersTable } from "./providers";

// A direct conversation between a customer (the request owner) and a provider,
// scoped to a specific request. Works both before an offer is accepted (the
// provider has bid on the request) and after (the provider is assigned).
export const chatMessagesTable = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id")
    .notNull()
    .references(() => requestsTable.id),
  providerId: integer("provider_id")
    .notNull()
    .references(() => providersTable.id),
  senderId: integer("sender_id")
    .notNull()
    .references(() => usersTable.id),
  body: text("body").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertChatMessageSchema = createInsertSchema(
  chatMessagesTable,
).omit({
  id: true,
  isRead: true,
  createdAt: true,
});
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessagesTable.$inferSelect;
