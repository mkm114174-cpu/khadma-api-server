import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import { emailOTPClient, jwtClient } from "better-auth/client/plugins";
import * as SecureStore from "expo-secure-store";

import {
  clearAuthSessionCache,
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

/**
 * Neon Auth is Better Auth under the hood. The default @neondatabase/neon-js
 * client uses browser cookies/localStorage and crashes React Native on launch.
 * @better-auth/expo stores session cookies in SecureStore instead.
 *
 * React Native often cannot read Set-Cookie headers, so we also persist the
 * session token from the JSON body after sign-in (email OTP, password, etc.).
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

      const data = ctx.data as AuthSessionPayload | null;
      if (data?.user && (data.session || data.token)) {
        await persistAuthSession(data);
        notifySessionChanged();
      }

      if (jwt && ctx.data?.session) {
        ctx.data.session.token = jwt;
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

/** Call after any successful sign-in / OTP verify so the app sees the session. */
export async function finalizeAuthSession(
  payload: AuthSessionPayload | null | undefined,
): Promise<boolean> {
  if (payload?.user) {
    const ok = await persistAuthSession(payload);
    if (ok) {
      notifySessionChanged();
      return true;
    }
  }

  // OAuth and some flows store the cookie via onSuccess but omit user in the body.
  try {
    const { data } = await withAuthTimeout(authClient.getSession());
    if (data?.session && data?.user) {
      const ok = await persistAuthSession(data as AuthSessionPayload);
      if (ok) {
        notifySessionChanged();
        return true;
      }
    }
  } catch (err) {
    console.warn("[neonAuth] finalizeAuthSession getSession fallback failed:", err);
  }
  return false;
}

export async function getAccessToken(): Promise<string | null> {
  const cachedJwt = readCachedJwt();
  if (cachedJwt) return cachedJwt;

  const cached = readCachedSession();
  if (cached?.session.token) return cached.session.token;

  try {
    const { data } = await withAuthTimeout(authClient.getSession());
    const token = data?.session?.token;
    if (typeof token === "string" && token.length > 0) return token;
  } catch {
    // fall through
  }
  return null;
}

export async function hasActiveSession(): Promise<boolean> {
  if (readCachedSession()) return true;

  try {
    const { data } = await withAuthTimeout(authClient.getSession());
    if (data?.session && data?.user) {
      await persistAuthSession(data as AuthSessionPayload);
      return true;
    }
  } catch (err) {
    console.warn("[neonAuth] getSession failed:", err);
  }
  return false;
}

export type { AuthSessionPayload } from "@/lib/authSession";

export async function signOutAuth(): Promise<void> {
  clearAuthSessionCache();
  try {
    await withAuthTimeout(authClient.signOut());
  } catch {
    // local cache already cleared
  }
}
