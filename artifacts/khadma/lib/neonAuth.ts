import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import { emailOTPClient, jwtClient } from "better-auth/client/plugins";
import * as SecureStore from "expo-secure-store";

import {
  clearAuthSessionCache,
  isJwtValid,
  mergeAuthCookiesFromHeader,
  persistAuthJwt,
  persistAuthSession,
  readCachedJwt,
  readCachedSession,
  type AuthSessionPayload,
} from "@/lib/authSession";

const authUrl = process.env.EXPO_PUBLIC_NEON_AUTH_URL?.replace(/\/$/, "");

if (!authUrl) {
  console.warn(
    "EXPO_PUBLIC_NEON_AUTH_URL is not set — auth will not work until configured.",
  );
}

export const AUTH_TIMEOUT_MS = 15_000;
/** Google OAuth opens a browser — needs a much longer timeout. */
export const OAUTH_TIMEOUT_MS = 120_000;

export function withAuthTimeout<T>(promise: Promise<T>, ms = AUTH_TIMEOUT_MS): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Auth request timed out after ${ms}ms`)),
      ms,
    );
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

let lastJwtRefresh = 0;

/**
 * Neon Auth is Better Auth under the hood. The API server only accepts JWT
 * Bearer tokens (verified via JWKS). OTP/OAuth return an opaque session token
 * in the JSON body — we must exchange it for a JWT via /get-session or /token.
 */
export const authClient = createAuthClient({
  baseURL: authUrl ?? "https://placeholder.invalid/auth",
  plugins: [
    expoClient({
      scheme: "khadma",
      storagePrefix: "khadma",
      storage: SecureStore,
    }),
    emailOTPClient(),
    jwtClient(),
  ],
  fetchOptions: {
    throw: false,
    onSuccess: async (ctx) => {
      const jwt = ctx.response.headers.get("set-auth-jwt");
      if (jwt) await persistAuthJwt(jwt);

      const setCookie = ctx.response.headers.get("set-cookie");
      if (setCookie) await mergeAuthCookiesFromHeader(setCookie);

      // Cache session body from get-session only (expo client also does this).
      const url = ctx.request.url.toString();
      if (url.includes("/get-session")) {
        const data = ctx.data as AuthSessionPayload | null;
        if (data?.user && data.session) {
          await persistAuthSession(data);
        }
      }
    },
  },
});

function notifySessionChanged() {
  try {
    authClient.$store.notify("$sessionSignal");
  } catch {
    // ignore if store not ready
  }
}

/**
 * Obtain a JWT for API calls. The Khadma API only accepts JWT — never the
 * opaque session.token from sign-in responses.
 */
export async function refreshApiJwt(
  opaqueToken?: string | null,
): Promise<string | null> {
  const cached = readCachedJwt();
  if (isJwtValid(cached)) return cached;

  // Avoid hammering auth server.
  if (Date.now() - lastJwtRefresh < 500) {
    return readCachedJwt();
  }
  lastJwtRefresh = Date.now();

  const bearer =
    opaqueToken ?? readCachedSession()?.session.token ?? null;

  // 1) Try getSession via auth client (uses signed cookie jar).
  try {
    const { data } = await withAuthTimeout(authClient.getSession());
    const jwt = readCachedJwt();
    if (isJwtValid(jwt)) return jwt;
    if (data?.user && data.session) {
      await persistAuthSession(data as AuthSessionPayload);
    }
  } catch (err) {
    console.warn("[neonAuth] getSession for JWT failed:", err);
  }

  const jwtAfterSession = readCachedJwt();
  if (isJwtValid(jwtAfterSession)) return jwtAfterSession;

  // 2) Exchange opaque session token for JWT via Bearer (Neon bearer plugin).
  if (!bearer || !authUrl) return null;

  for (const path of ["/token", "/get-session"] as const) {
    try {
      const res = await withAuthTimeout(
        fetch(`${authUrl}${path}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${bearer}`,
            Accept: "application/json",
          },
        }),
      );

      const jwtHeader = res.headers.get("set-auth-jwt");
      if (jwtHeader) {
        await persistAuthJwt(jwtHeader);
        return jwtHeader;
      }

      const setCookie = res.headers.get("set-cookie");
      if (setCookie) await mergeAuthCookiesFromHeader(setCookie);

      if (res.ok) {
        const body = (await res.json()) as { token?: string };
        if (typeof body?.token === "string" && body.token.includes(".")) {
          await persistAuthJwt(body.token);
          return body.token;
        }
      }

      // get-session may have set JWT via header only
      const jwt = readCachedJwt();
      if (isJwtValid(jwt)) return jwt;
    } catch (err) {
      console.warn(`[neonAuth] Bearer ${path} JWT exchange failed:`, err);
    }
  }

  return readCachedJwt();
}

/** Call after any successful sign-in / OTP verify so the app can call the API. */
export async function finalizeAuthSession(
  payload: AuthSessionPayload | null | undefined,
): Promise<boolean> {
  const opaque = payload?.token ?? payload?.session?.token ?? null;

  if (payload?.user) {
    await persistAuthSession(payload);
  }

  const jwt = await refreshApiJwt(
    typeof opaque === "string" ? opaque : null,
  );

  if (isJwtValid(jwt)) {
    notifySessionChanged();
    return true;
  }

  // OAuth may have stored signed cookies without user in response body.
  const jwtRetry = await refreshApiJwt();
  if (isJwtValid(jwtRetry)) {
    notifySessionChanged();
    return true;
  }

  return false;
}

export async function getAccessToken(): Promise<string | null> {
  const cached = readCachedJwt();
  if (isJwtValid(cached)) return cached;
  return refreshApiJwt();
}

export async function hasActiveSession(): Promise<boolean> {
  if (readCachedSession()) {
    const jwt = await refreshApiJwt();
    if (isJwtValid(jwt)) return true;
  }

  try {
    const { data } = await withAuthTimeout(authClient.getSession());
    if (data?.session && data?.user) {
      await persistAuthSession(data as AuthSessionPayload);
      const jwt = await refreshApiJwt();
      return isJwtValid(jwt);
    }
  } catch (err) {
    console.warn("[neonAuth] getSession failed:", err);
  }
  return false;
}

export type { AuthSessionPayload } from "@/lib/authSession";

export async function signOutAuth(): Promise<void> {
  await clearAuthSessionCache();
  lastJwtRefresh = 0;
  try {
    await withAuthTimeout(authClient.signOut());
  } catch {
    // local cache already cleared
  }
}
