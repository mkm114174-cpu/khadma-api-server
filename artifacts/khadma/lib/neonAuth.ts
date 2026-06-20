import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import { emailOTPClient, jwtClient } from "better-auth/client/plugins";
import * as SecureStore from "expo-secure-store";

const authUrl = process.env.EXPO_PUBLIC_NEON_AUTH_URL?.replace(/\/$/, "");

if (!authUrl) {
  console.warn(
    "EXPO_PUBLIC_NEON_AUTH_URL is not set — auth will not work until configured.",
  );
}

const SESSION_TIMEOUT_MS = 8_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
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
      if (jwt && ctx.data?.session) {
        ctx.data.session.token = jwt;
      }
    },
  },
});

export async function getAccessToken(): Promise<string | null> {
  try {
    const { data } = await withTimeout(authClient.getSession(), SESSION_TIMEOUT_MS);
    const token = data?.session?.token;
    return typeof token === "string" && token.length > 0 ? token : null;
  } catch {
    return null;
  }
}

export async function hasActiveSession(): Promise<boolean> {
  try {
    const { data } = await withTimeout(authClient.getSession(), SESSION_TIMEOUT_MS);
    return Boolean(data?.session && data?.user);
  } catch (err) {
    console.warn("[neonAuth] getSession failed:", err);
    return false;
  }
}
