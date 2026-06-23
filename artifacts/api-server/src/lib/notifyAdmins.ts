import { db, usersTable, notificationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

type NotifLang = "ar" | "en" | "he";

/** Notify every admin user (in-app — يظهر في تطبيق الأدمن عند التحديث). */
export async function notifyAllAdmins(opts: {
  title: string;
  body: string;
  type: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  const admins = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.role, "admin"));

  if (admins.length === 0) return;

  await db.insert(notificationsTable).values(
    admins.map((a) => ({
      userId: a.id,
      title: opts.title,
      body: opts.body,
      type: opts.type,
      data: opts.data ?? null,
    })),
  );
}

export function resolveLang(value: string | null | undefined): NotifLang {
  return value === "en" || value === "he" ? value : "ar";
}
