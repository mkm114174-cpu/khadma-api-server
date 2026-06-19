import type { Request, Response, NextFunction } from "express";
import { db, usersTable, providersTable, type User, type Provider } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  getAuthUserIdFromPayload,
  getBearerToken,
  verifyNeonAuthToken,
} from "./neonAuth";

export interface AuthedRequest extends Request {
  authUserId?: string;
  dbUser?: User;
}

export async function getAuthUserId(req: Request): Promise<string | null> {
  const token = getBearerToken(req.headers.authorization);
  if (!token) return null;
  try {
    const payload = await verifyNeonAuthToken(token);
    return getAuthUserIdFromPayload(payload);
  } catch {
    return null;
  }
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
  const authUserId = await getAuthUserId(req);
  if (!authUserId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const user = await loadDbUserByAuthId(authUserId);
  if (!user) {
    res.status(404).json({ error: "User not provisioned" });
    return;
  }
  (req as AuthedRequest).authUserId = authUserId;
  (req as AuthedRequest).dbUser = user;
  next();
};

export const optionalUser = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  const authUserId = await getAuthUserId(req);
  if (authUserId) {
    (req as AuthedRequest).authUserId = authUserId;
    const user = await loadDbUserByAuthId(authUserId);
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
    const authUserId = await getAuthUserId(req);
    if (!authUserId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const user =
      (req as AuthedRequest).dbUser ??
      (await loadDbUserByAuthId(authUserId));
    if (!user) {
      res.status(404).json({ error: "User not provisioned" });
      return;
    }
    if (!roles.includes(user.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    (req as AuthedRequest).authUserId = authUserId;
    (req as AuthedRequest).dbUser = user;
    next();
  };
}
