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

export async function verifyNeonAuthToken(
  token: string,
): Promise<JWTPayload> {
  const base = getNeonAuthBaseUrl();
  const issuer = new URL(base).origin;
  const { payload } = await jwtVerify(token, getJwks(), { issuer });
  return payload;
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
