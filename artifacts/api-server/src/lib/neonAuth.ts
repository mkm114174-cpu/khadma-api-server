import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getNeonAuthBaseUrl(): string {
  const url = process.env.NEON_AUTH_BASE_URL?.trim();
  if (!url) {
    throw new Error("NEON_AUTH_BASE_URL is required for JWT verification");
  }
  return url.replace(/\/$/, "");
}

function getJwks() {
  if (!jwks) {
    const base = getNeonAuthBaseUrl();
    jwks = createRemoteJWKSet(new URL(`${base}/.well-known/jwks.json`));
  }
  return jwks;
}

/** Better Auth JWT `iss` is usually the full auth base URL, not origin-only. */
function jwtIssuers(base: string): string[] {
  const origin = new URL(base).origin;
  return base === origin ? [base] : [base, origin];
}

/** Validate opaque Better Auth session token via Neon get-session (Bearer). */
async function introspectNeonSession(
  opaqueToken: string,
): Promise<JWTPayload | null> {
  const base = getNeonAuthBaseUrl();
  try {
    const res = await fetch(`${base}/get-session`, {
      headers: {
        Authorization: `Bearer ${opaqueToken}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      user?: { id?: string; email?: string | null };
    } | null;
    const userId = data?.user?.id;
    if (!userId) return null;
    return {
      sub: userId,
      email: data?.user?.email ?? undefined,
    };
  } catch {
    return null;
  }
}

export async function verifyNeonAuthToken(
  token: string,
): Promise<JWTPayload> {
  const base = getNeonAuthBaseUrl();

  // JWT (three dot-separated segments)
  if (token.split(".").length === 3) {
    let lastErr: unknown;
    for (const issuer of jwtIssuers(base)) {
      try {
        const { payload } = await jwtVerify(token, getJwks(), { issuer });
        return payload;
      } catch (err) {
        lastErr = err;
      }
    }
    if (process.env.NODE_ENV !== "production") {
      console.warn("[neonAuth] JWT verify failed, trying session introspection", lastErr);
    }
  }

  // Opaque session token from email OTP (React Native cannot always read Set-Cookie)
  const session = await introspectNeonSession(token);
  if (session) return session;

  throw new Error("Invalid auth token");
}

export function getBearerToken(
  authorizationHeader: string | undefined,
): string | null {
  if (!authorizationHeader) return null;
  const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();
  return token || null;
}

export function getAuthUserIdFromPayload(payload: JWTPayload): string | null {
  const sub = payload.sub;
  return typeof sub === "string" && sub.length > 0 ? sub : null;
}

export function getEmailFromPayload(payload: JWTPayload): string | null {
  const email = payload.email;
  return typeof email === "string" && email.includes("@") ? email : null;
}
