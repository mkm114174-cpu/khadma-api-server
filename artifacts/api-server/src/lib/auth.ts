import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable, providersTable, type User, type Provider } from "@workspace/db";
import { eq } from "drizzle-orm";

export interface AuthedRequest extends Request {
  clerkUserId?: string;
  dbUser?: User;
}

export function getClerkUserId(req: Request): string | null {
  const auth = getAuth(req);
  return auth?.userId ?? null;
}

export async function loadDbUserByClerkId(
  clerkUserId: string,
): Promise<User | null> {
  const rows = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkUserId, clerkUserId))
    .limit(1);
  return rows[0] ?? null;
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

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const clerkUserId = getClerkUserId(req);
  if (!clerkUserId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  (req as AuthedRequest).clerkUserId = clerkUserId;
  next();
};

export const requireUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const clerkUserId = getClerkUserId(req);
  if (!clerkUserId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const user = await loadDbUserByClerkId(clerkUserId);
  if (!user) {
    res.status(404).json({ error: "User not provisioned" });
    return;
  }
  (req as AuthedRequest).clerkUserId = clerkUserId;
  (req as AuthedRequest).dbUser = user;
  next();
};

export const optionalUser = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  const clerkUserId = getClerkUserId(req);
  if (clerkUserId) {
    (req as AuthedRequest).clerkUserId = clerkUserId;
    const user = await loadDbUserByClerkId(clerkUserId);
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
    const clerkUserId = getClerkUserId(req);
    if (!clerkUserId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const user =
      (req as AuthedRequest).dbUser ??
      (await loadDbUserByClerkId(clerkUserId));
    if (!user) {
      res.status(404).json({ error: "User not provisioned" });
      return;
    }
    if (!roles.includes(user.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    (req as AuthedRequest).clerkUserId = clerkUserId;
    (req as AuthedRequest).dbUser = user;
    next();
  };
}
