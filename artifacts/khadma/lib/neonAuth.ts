import { createAuthClient } from "@neondatabase/neon-js/auth";

const authUrl = process.env.EXPO_PUBLIC_NEON_AUTH_URL;

if (!authUrl) {
  console.warn(
    "EXPO_PUBLIC_NEON_AUTH_URL is not set — auth will not work until configured.",
  );
}

export const authClient = createAuthClient(
  authUrl ?? "https://placeholder.invalid/auth",
);

export async function getAccessToken(): Promise<string | null> {
  const { data } = await authClient.getSession();
  const token = data?.session?.token;
  return typeof token === "string" && token.length > 0 ? token : null;
}

export async function hasActiveSession(): Promise<boolean> {
  const { data } = await authClient.getSession();
  return Boolean(data?.session && data?.user);
}
