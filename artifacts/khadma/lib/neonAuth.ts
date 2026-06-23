import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/client";
import { emailOTPClient, jwtClient } from "better-auth/client/plugins";
import * as SecureStore from "expo-secure-store";

const authUrl = process.env.EXPO_PUBLIC_NEON_AUTH_URL;
const JWT_STORE_KEY = "khadma_auth_jwt";
const EXPO_SESSION_CACHE_KEY = "khadma_session_data";
const EXPO_COOKIE_KEY = "khadma_cookie";

type CachedSessionPayload = {
  session?: { token?: string; expiresAt?: string };
  user?: unknown;
};

if (!authUrl) {
  console.warn(
    "EXPO_PUBLIC_NEON_AUTH_URL is not set — auth will not work until configured.",
  );
}

export const authClient = createAuthClient({
  baseURL: authUrl ?? "https://placeholder.invalid/auth",
  plugins: [
    expoClient({
      scheme: "khadma",
      storagePrefix: "khadma",
      storage: SecureStore,
    }),
    jwtClient(),
    emailOTPClient(),
  ],
  fetchOptions: {
    throw: false,
    onSuccess: (ctx) => {
      const jwt = ctx.response.headers.get("set-auth-jwt");
      if (jwt && isJwt(jwt)) {
        void persistJwt(jwt);
        rememberJwt(jwt);
      }
    },
  },
});

let cachedJwt: string | null = null;
let cachedJwtExp = 0;

function isJwt(value: string): boolean {
  return value.split(".").length === 3;
}

function readJwtExp(token: string): number {
  try {
    if (typeof globalThis.atob !== "function") {
      return Math.floor(Date.now() / 1000) + 900;
    }
    const payload = token.split(".")[1];
    if (!payload) return 0;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = globalThis.atob(normalized);
    const parsed = JSON.parse(json) as { exp?: unknown };
    return typeof parsed.exp === "number" ? parsed.exp : 0;
  } catch {
    return 0;
  }
}

function rememberJwt(token: string): string {
  cachedJwt = token;
  cachedJwtExp = readJwtExp(token);
  return token;
}

async function persistJwt(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(
      JWT_STORE_KEY,
      JSON.stringify({ token, exp: readJwtExp(token) }),
    );
  } catch {
    // ignore storage failures
  }
}

async function loadPersistedJwt(): Promise<string | null> {
  try {
    const raw = await SecureStore.getItemAsync(JWT_STORE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { token?: string; exp?: number };
    if (typeof parsed.token !== "string" || !isJwt(parsed.token)) return null;
    const now = Math.floor(Date.now() / 1000);
    const exp = typeof parsed.exp === "number" ? parsed.exp : readJwtExp(parsed.token);
    if (exp > now + 30) {
      return rememberJwt(parsed.token);
    }
  } catch {
    // ignore
  }
  return null;
}

async function readCachedExpoSession(): Promise<CachedSessionPayload | null> {
  try {
    const raw = await SecureStore.getItemAsync(EXPO_SESSION_CACHE_KEY);
    if (!raw || raw === "{}") return null;
    const parsed = JSON.parse(raw) as CachedSessionPayload;
    if (!parsed?.session || !parsed?.user) return null;
    const expiresAt = parsed.session.expiresAt;
    if (expiresAt && new Date(expiresAt) < new Date()) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function hasCachedAuthCookie(): Promise<boolean> {
  try {
    const raw = await SecureStore.getItemAsync(EXPO_COOKIE_KEY);
    if (!raw || raw === "{}") return false;
    const parsed = JSON.parse(raw) as Record<
      string,
      { value?: string; expires?: string | null }
    >;
    for (const entry of Object.values(parsed)) {
      if (!entry?.value) continue;
      if (entry.expires && new Date(entry.expires) < new Date()) continue;
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

async function readSessionToken(): Promise<string | null> {
  const { data } = await authClient.getSession();
  const liveToken = data?.session?.token;
  if (typeof liveToken === "string" && liveToken.length > 0) {
    return liveToken;
  }

  const cached = await readCachedExpoSession();
  const cachedToken = cached?.session?.token;
  if (typeof cachedToken === "string" && cachedToken.length > 0) {
    return cachedToken;
  }

  return null;
}

async function fetchJwtFromServer(): Promise<string | null> {
  const sessionToken = await readSessionToken();
  if (!sessionToken) return null;

  try {
    const result = await authClient.$fetch<{ token: string }>("/token", {
      method: "GET",
      headers: { Authorization: `Bearer ${sessionToken}` },
    });
    if (result.error) {
      console.warn("JWT /token failed:", result.error);
      return null;
    }
    const token = result.data?.token;
    if (typeof token === "string" && isJwt(token)) {
      await persistJwt(token);
      return rememberJwt(token);
    }
  } catch (err) {
    console.warn("fetchJwtFromServer failed", err);
  }
  return null;
}

async function captureJwtFromSession(): Promise<string | null> {
  let captured: string | null = null;
  const { data } = await authClient.getSession({
    fetchOptions: {
      onSuccess: (ctx) => {
        const jwt = ctx.response.headers.get("set-auth-jwt");
        if (jwt && isJwt(jwt)) captured = jwt;
      },
    },
  });
  if (captured) {
    await persistJwt(captured);
    return rememberJwt(captured);
  }
  const sessionToken = data?.session?.token;
  if (typeof sessionToken === "string" && isJwt(sessionToken)) {
    await persistJwt(sessionToken);
    return rememberJwt(sessionToken);
  }
  return null;
}

export function clearAccessTokenCache(): void {
  cachedJwt = null;
  cachedJwtExp = 0;
  void SecureStore.deleteItemAsync(JWT_STORE_KEY).catch(() => {});
}

export async function getAccessToken(): Promise<string | null> {
  try {
    const now = Math.floor(Date.now() / 1000);
    if (cachedJwt && cachedJwtExp > now + 30) {
      return cachedJwt;
    }

    const stored = await loadPersistedJwt();
    if (stored) return stored;

    const fromServer = await fetchJwtFromServer();
    if (fromServer) return fromServer;

    return await captureJwtFromSession();
  } catch (err) {
    console.warn("getAccessToken failed", err);
    return null;
  }
}

export async function hasActiveSession(): Promise<boolean> {
  const { data } = await authClient.getSession();
  if (data?.session && data?.user) return true;

  const cached = await readCachedExpoSession();
  if (cached?.session && cached?.user) return true;

  return hasCachedAuthCookie();
}

export async function refreshAccessToken(): Promise<string | null> {
  cachedJwt = null;
  cachedJwtExp = 0;
  return getAccessToken();
}
