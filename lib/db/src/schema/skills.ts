import {
  pgTable,
  text,
  serial,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const skillsTable = pgTable("skills", {
  id: serial("id").primaryKey(),
  // Arabic name (primary)
  name: text("name").notNull(),
  nameEn: text("name_en"),
  nameHe: text("name_he"),
  // Arabic description (primary) + translations
  description: text("description"),
  descriptionEn: text("description_en"),
  descriptionHe: text("description_he"),
  // e.g. plumbing, electrical, custom
  slug: text("slug").notNull().unique(),
  // section id this service belongs to (one of the customer-facing categories)
  category: text("category"),
  icon: text("icon"),
  color: text("color"),
  // uploaded image object path (served via storage)
  image: text("image"),
  // built_in | custom
  type: text("type").notNull().default("built_in"),
  // pending | approved | rejected
  status: text("status").notNull().default("approved"),
  // for custom skills: who created it
  createdByUserId: integer("created_by_user_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertSkillSchema = createInsertSchema(skillsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertSkill = z.infer<typeof insertSkillSchema>;
export type Skill = typeof skillsTable.$inferSelect;
