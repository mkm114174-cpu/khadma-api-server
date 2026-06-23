import {
  pgTable,
  serial,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { providersTable } from "./providers";
import { skillsTable } from "./skills";

export const providerSkillsTable = pgTable("provider_skills", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id")
    .notNull()
    .references(() => providersTable.id, { onDelete: "cascade" }),
  skillId: integer("skill_id")
    .notNull()
    .references(() => skillsTable.id, { onDelete: "cascade" }),
  // provider's experience level for this skill
  experienceYears: integer("experience_years"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertProviderSkillSchema = createInsertSchema(providerSkillsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertProviderSkill = z.infer<typeof insertProviderSkillSchema>;
export type ProviderSkill = typeof providerSkillsTable.$inferSelect;
