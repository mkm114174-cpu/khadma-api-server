import * as SecureStore from "expo-secure-store";
import { parseSetCookieHeader } from "better-auth/cookies";

const STORAGE_PREFIX = "khadma";
export const COOKIE_STORE_KEY = `${STORAGE_PREFIX}_cookie`;
export const SESSION_CACHE_KEY = `${STORAGE_PREFIX}_session_data`;
export const JWT_STORE_KEY = `${STORAGE_PREFIX}_jwt`;

export type AuthUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  emailVerified?: boolean;
  [key: string]: unknown;
};

export type AuthSessionPayload = {
  token?: string;
  session?: { token?: string; [key: string]: unknown } | null;
  user?: AuthUser | null;
};

function sessionToken(payload: AuthSessionPayload | null | undefined): string | null {
  if (!payload) return null;
  const fromSession = payload.session?.token;
  if (typeof fromSession === "string" && fromSession.length > 0) return fromSession;
  if (typeof payload.token === "string" && payload.token.length > 0) return payload.token;
  return null;
}

/**
 * Cache user + opaque session token locally for UI/session checks.
 * Does NOT write the cookie jar — @better-auth/expo owns signed cookies.
 */
export async function persistAuthSession(
  payload: AuthSessionPayload,
): Promise<boolean> {
  const token = sessionToken(payload);
  const user = payload.user;
  if (!token || !user) return false;

  const sessionBody = {
    user,
    session: {
      ...(payload.session && typeof payload.session === "object"
        ? payload.session
        : {}),
      token,
    },
  };

  await SecureStore.setItemAsync(SESSION_CACHE_KEY, JSON.stringify(sessionBody));
  return true;
}

export async function persistAuthJwt(jwt: string): Promise<void> {
  if (jwt) await SecureStore.setItemAsync(JWT_STORE_KEY, jwt);
}

/** Merge Set-Cookie into the expo cookie jar (signed values from the server). */
export async function mergeAuthCookiesFromHeader(
  setCookieHeader: string,
): Promise<void> {
  const parsed = parseSetCookieHeader(setCookieHeader);
  let merged: Record<string, { value: string; expires: string | null }> = {};

  try {
    const prev = await SecureStore.getItemAsync(COOKIE_STORE_KEY);
    if (prev) merged = JSON.parse(prev) as typeof merged;
  } catch {
    // start fresh
  }

  parsed.forEach((cookie, key) => {
    const expiresAt = cookie.expires;
    const maxAge = cookie["max-age"];
    const expires = maxAge
      ? new Date(Date.now() + Number(maxAge) * 1000).toISOString()
      : expiresAt
        ? new Date(String(expiresAt)).toISOString()
        : null;
    merged[key] = { value: cookie.value, expires };
  });

  await SecureStore.setItemAsync(COOKIE_STORE_KEY, JSON.stringify(merged));
}

export function readCachedSession(): {
  user: AuthUser;
  session: { token: string; [key: string]: unknown };
} | null {
  try {
    const raw = SecureStore.getItem(SESSION_CACHE_KEY);
    if (!raw || raw === "{}") return null;
    const parsed = JSON.parse(raw) as AuthSessionPayload;
    const token = sessionToken(parsed);
    if (!token || !parsed.user) return null;
    return {
      user: parsed.user,
      session: {
        ...(parsed.session && typeof parsed.session === "object"
          ? parsed.session
          : {}),
        token,
      },
    };
  } catch {
    return null;
  }
}

export function readCachedJwt(): string | null {
  try {
    const jwt = SecureStore.getItem(JWT_STORE_KEY);
    return jwt && jwt.length > 0 ? jwt : null;
  } catch {
    return null;
  }
}

/** True if JWT exists and is not expired (60s buffer). */
export function isJwtValid(jwt: string | null): boolean {
  if (!jwt) return false;
  try {
    const parts = jwt.split(".");
    if (parts.length < 2) return false;
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")),
    ) as { exp?: number };
    if (!payload.exp) return true;
    return payload.exp * 1000 > Date.now() + 60_000;
  } catch {
    return false;
  }
}

export async function clearAuthSessionCache(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(COOKIE_STORE_KEY).catch(() => {}),
    SecureStore.deleteItemAsync(SESSION_CACHE_KEY).catch(() => {}),
    SecureStore.deleteItemAsync(JWT_STORE_KEY).catch(() => {}),
  ]);
}
