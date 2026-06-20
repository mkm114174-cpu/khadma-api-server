import * as SecureStore from "expo-secure-store";

const STORAGE_PREFIX = "khadma";
export const COOKIE_STORE_KEY = `${STORAGE_PREFIX}_cookie`;
export const SESSION_CACHE_KEY = `${STORAGE_PREFIX}_session_data`;
export const JWT_STORE_KEY = `${STORAGE_PREFIX}_jwt`;
const COOKIE_PREFIX = "better-auth";

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

/** Persist Better Auth session for @better-auth/expo (SecureStore cookie jar). */
export async function persistAuthSession(
  payload: AuthSessionPayload,
): Promise<boolean> {
  const token = sessionToken(payload);
  const user = payload.user;
  if (!token || !user) return false;

  const cookieJson = JSON.stringify({
    [`${COOKIE_PREFIX}.session_token`]: { value: token, expires: null },
  });

  const sessionBody = {
    user,
    session: {
      ...(payload.session && typeof payload.session === "object"
        ? payload.session
        : {}),
      token,
    },
  };

  SecureStore.setItem(COOKIE_STORE_KEY, cookieJson);
  SecureStore.setItem(SESSION_CACHE_KEY, JSON.stringify(sessionBody));
  return true;
}

export async function persistAuthJwt(jwt: string): Promise<void> {
  if (jwt) SecureStore.setItem(JWT_STORE_KEY, jwt);
}

export function readCachedSession(): {
  user: AuthUser;
  session: { token: string; [key: string]: unknown };
} | null {
  try {
    const raw = SecureStore.getItem(SESSION_CACHE_KEY);
    if (!raw) return null;
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

export function clearAuthSessionCache(): void {
  try {
    SecureStore.setItem(COOKIE_STORE_KEY, "{}");
    SecureStore.setItem(SESSION_CACHE_KEY, "{}");
    SecureStore.deleteItemAsync(JWT_STORE_KEY).catch(() => {});
  } catch {
    // ignore
  }
}
