import type { Request, Response, NextFunction } from "express";
import { db, usersTable, providersTable, type User, type Provider } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import {
  getAuthUserIdFromPayload,
  getBearerToken,
  getEmailFromPayload,
  verifyNeonAuthToken,
} from "./neonAuth";

export interface AuthedRequest extends Request {
  authUserId?: string;
  dbUser?: User;
}

async function getVerifiedAuth(
  req: Request,
): Promise<{ authUserId: string; email: string | null } | null> {
  const token = getBearerToken(req.headers.authorization);
  if (!token) return null;
  try {
    const payload = await verifyNeonAuthToken(token);
    const authUserId = getAuthUserIdFromPayload(payload);
    if (!authUserId) return null;
    return { authUserId, email: getEmailFromPayload(payload) };
  } catch {
    return null;
  }
}

export async function getAuthUserId(req: Request): Promise<string | null> {
  const auth = await getVerifiedAuth(req);
  return auth?.authUserId ?? null;
}

export async function loadDbUserByAuthId(
  authUserId: string,
): Promise<User | null> {
  const rows = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.authUserId, authUserId))
    .limit(1);
  return rows[0] ?? null;
}

/** Re-link a legacy Clerk row to the current Neon Auth user id by verified email. */
async function relinkDbUserByEmail(
  authUserId: string,
  email: string,
): Promise<User | null> {
  const normalized = email.trim().toLowerCase();
  const [existing] = await db
    .select()
    .from(usersTable)
    .where(sql`lower(${usersTable.email}) = ${normalized}`)
    .limit(1);
  if (!existing || existing.authUserId === authUserId) {
    return existing ?? null;
  }

  const [updated] = await db
    .update(usersTable)
    .set({ authUserId })
    .where(eq(usersTable.id, existing.id))
    .returning();
  return updated ?? null;
}

export async function resolveDbUser(
  authUserId: string,
  email: string | null,
): Promise<User | null> {
  const byAuth = await loadDbUserByAuthId(authUserId);
  if (byAuth) return byAuth;
  if (!email) return null;
  return relinkDbUserByEmail(authUserId, email);
}

export async function getProviderByUserId(
  userId: number,
): Promise<Provider | null> {
  const rows = await db
    .select()
    .from(providersTable)
    .where(eq(providersTable.userId, userId))
    .limit(1);
  return rows[0] ?? null;
}

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authUserId = await getAuthUserId(req);
  if (!authUserId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  (req as AuthedRequest).authUserId = authUserId;
  next();
};

export const requireUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const auth = await getVerifiedAuth(req);
  if (!auth) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const user = await resolveDbUser(auth.authUserId, auth.email);
  if (!user) {
    res.status(404).json({ error: "User not provisioned" });
    return;
  }
  (req as AuthedRequest).authUserId = auth.authUserId;
  (req as AuthedRequest).dbUser = user;
  next();
};

export const optionalUser = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  const auth = await getVerifiedAuth(req);
  if (auth) {
    (req as AuthedRequest).authUserId = auth.authUserId;
    const user = await resolveDbUser(auth.authUserId, auth.email);
    if (user) {
      (req as AuthedRequest).dbUser = user;
    }
  }
  next();
};

export function requireRole(...roles: string[]) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const auth = await getVerifiedAuth(req);
    if (!auth) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const user =
      (req as AuthedRequest).dbUser ??
      (await resolveDbUser(auth.authUserId, auth.email));
    if (!user) {
      res.status(404).json({ error: "User not provisioned" });
      return;
    }
    if (!roles.includes(user.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    (req as AuthedRequest).authUserId = auth.authUserId;
    (req as AuthedRequest).dbUser = user;
    next();
  };
}
