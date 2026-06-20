#!/usr/bin/env node
/**
 * Ensures release APK builds have production API + Neon Auth URLs baked in.
 * Prevents shipping builds that point at localhost (broken on real devices).
 */

function stripDomain(raw) {
  const value = raw.trim();
  if (!value) return "";
  try {
    const url = value.includes("://") ? value : `https://${value}`;
    return new URL(url).host;
  } catch {
    return value.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  }
}

export function validateReleaseEnv(env = process.env) {
  const domain = stripDomain(env.EXPO_PUBLIC_DOMAIN ?? "");
  const neonAuthUrl = (env.EXPO_PUBLIC_NEON_AUTH_URL ?? "").trim();

  const errors = [];

  if (!domain || domain === "localhost" || domain.startsWith("127.")) {
    errors.push(
      "EXPO_PUBLIC_DOMAIN must be your live API hostname (not localhost). " +
        "Example: khadma-api-server.onrender.com",
    );
  }

  if (!neonAuthUrl || !neonAuthUrl.includes("neonauth")) {
    errors.push(
      "EXPO_PUBLIC_NEON_AUTH_URL must be set to your Neon Auth URL from the Neon Console.",
    );
  }

  if (errors.length > 0) {
    console.error("\nRelease build blocked — missing production configuration:\n");
    for (const err of errors) {
      console.error(`  • ${err}`);
    }
    console.error(
      "\nSet GitHub repository variables EXPO_PUBLIC_DOMAIN and EXPO_PUBLIC_NEON_AUTH_URL,\n" +
        "or create artifacts/khadma/.env with both values before building.\n",
    );
    process.exit(1);
  }

  env.EXPO_PUBLIC_DOMAIN = domain;
  return { domain, neonAuthUrl };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  validateReleaseEnv();
  console.log("Production env OK:", stripDomain(process.env.EXPO_PUBLIC_DOMAIN ?? ""));
}
