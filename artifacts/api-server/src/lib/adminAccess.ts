import { db, usersTable, type User } from "@workspace/db";
import { and, eq, sql } from "drizzle-orm";
import { resolveDbUser } from "./auth";

/** إيميل مالك المنصة — دائماً مسموح له بدخول تطبيق الأدمن. */
export const OWNER_EMAIL = "mkm114174@gmail.com";

export async function isAllowedAdminEmail(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  if (normalized === OWNER_EMAIL) return true;

  const [user] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(
      and(
        eq(usersTable.role, "admin"),
        sql`lower(${usersTable.email}) = ${normalized}`,
      ),
    )
    .limit(1);
  return Boolean(user);
}

/** بعد تسجيل Clerk: تأكد أن حساب المالك مربوط كأدمن في قاعدة البيانات. */
export async function ensureAdminDbUser(
  authUserId: string,
  email: string,
): Promise<User | null> {
  const normalized = email.trim().toLowerCase();
  let user = await resolveDbUser(authUserId, normalized);

  if (normalized === OWNER_EMAIL) {
    if (!user) {
      const [created] = await db
        .insert(usersTable)
        .values({
          authUserId,
          name: "مدير المنصة",
          role: "admin",
          email: normalized,
          language: "ar",
        })
        .returning();
      return created ?? null;
    }
    if (user.role !== "admin" || user.authUserId !== authUserId) {
      const [updated] = await db
        .update(usersTable)
        .set({ role: "admin", authUserId })
        .where(eq(usersTable.id, user.id))
        .returning();
      return updated ?? user;
    }
    return user;
  }

  if (!user || user.role !== "admin") return null;
  return user;
}
