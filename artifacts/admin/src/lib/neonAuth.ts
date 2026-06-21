import { createAuthClient } from "better-auth/react";
import { emailOTPClient, jwtClient } from "better-auth/client/plugins";

const authUrl = import.meta.env.VITE_NEON_AUTH_URL?.replace(/\/$/, "");

const JWT_KEY = "khadma_admin_jwt";

if (!authUrl) {
  console.warn(
    "VITE_NEON_AUTH_URL is not set — admin auth will not work until configured.",
  );
}

export const authClient = createAuthClient({
  baseURL: authUrl ?? "https://placeholder.invalid/auth",
  plugins: [emailOTPClient(), jwtClient()],
  fetchOptions: {
    credentials: "include",
    onSuccess: async (ctx) => {
      const jwt = ctx.response.headers.get("set-auth-jwt");
      if (jwt) {
        try {
          sessionStorage.setItem(JWT_KEY, jwt);
        } catch {
          // ignore
        }
      }
    },
  },
});

function readCachedJwt(): string | null {
  try {
    const jwt = sessionStorage.getItem(JWT_KEY);
    return jwt && jwt.length > 0 ? jwt : null;
  } catch {
    return null;
  }
}

function isJwtValid(jwt: string | null): boolean {
  if (!jwt) return false;
  try {
    const parts = jwt.split(".");
    if (parts.length < 2) return false;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))) as {
      exp?: number;
    };
    if (!payload.exp) return true;
    return payload.exp * 1000 > Date.now() + 60_000;
  } catch {
    return false;
  }
}

async function refreshJwtFromSession(): Promise<string | null> {
  try {
    await authClient.getSession();
    const jwt = readCachedJwt();
    return isJwtValid(jwt) ? jwt : null;
  } catch {
    return null;
  }
}

export async function getAccessToken(): Promise<string | null> {
  const cached = readCachedJwt();
  if (isJwtValid(cached)) return cached;

  const refreshed = await refreshJwtFromSession();
  if (isJwtValid(refreshed)) return refreshed;

  try {
    const { data } = await authClient.getSession();
    const opaque = data?.session?.token;
    if (typeof opaque === "string" && opaque.length > 0) return opaque;
  } catch {
    // ignore
  }
  return null;
}

export async function hasActiveSession(): Promise<boolean> {
  try {
    const { data } = await authClient.getSession();
    return Boolean(data?.session && data?.user);
  } catch {
    return false;
  }
}
