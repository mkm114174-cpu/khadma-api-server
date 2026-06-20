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

/**
 * Neon Auth is Better Auth under the hood. The default @neondatabase/neon-js
 * client uses browser cookies/localStorage and crashes React Native on launch.
 * @better-auth/expo stores session cookies in SecureStore instead.
 */
function createKhadmaAuthClient() {
  return createAuthClient({
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
}

type KhadmaAuthClient = ReturnType<typeof createKhadmaAuthClient>;

let client: KhadmaAuthClient | null = null;

function getClient(): KhadmaAuthClient {
  if (!client) {
    client = createKhadmaAuthClient();
  }
  return client;
}

export const authClient: KhadmaAuthClient = new Proxy({} as KhadmaAuthClient, {
  get(_target, prop, receiver) {
    const value = Reflect.get(getClient(), prop, receiver);
    return typeof value === "function" ? value.bind(getClient()) : value;
  },
});

export async function getAccessToken(): Promise<string | null> {
  const { data } = await authClient.getSession();
  const token = data?.session?.token;
  return typeof token === "string" && token.length > 0 ? token : null;
}

export async function hasActiveSession(): Promise<boolean> {
  const { data } = await authClient.getSession();
  return Boolean(data?.session && data?.user);
}
