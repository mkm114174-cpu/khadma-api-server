#!/usr/bin/env node
/**
 * Smoke test for auth session + JWT logic (Node shim for SecureStore).
 */
import assert from "node:assert/strict";

const store = new Map();

const SecureStore = {
  setItemAsync: async (key, value) => {
    store.set(key, value);
  },
  getItem: (key) => store.get(key) ?? null,
  getItemAsync: async (key) => store.get(key) ?? null,
  deleteItemAsync: async (key) => {
    store.delete(key);
  },
};

const SESSION_CACHE_KEY = "khadma_session_data";
const JWT_STORE_KEY = "khadma_jwt";

function sessionToken(payload) {
  const fromSession = payload.session?.token;
  if (typeof fromSession === "string" && fromSession.length > 0) return fromSession;
  if (typeof payload.token === "string" && payload.token.length > 0) return payload.token;
  return null;
}

async function persistAuthSession(payload) {
  const token = sessionToken(payload);
  const user = payload.user;
  if (!token || !user) return false;
  await SecureStore.setItemAsync(
    SESSION_CACHE_KEY,
    JSON.stringify({ user, session: { token } }),
  );
  return true;
}

async function persistAuthJwt(jwt) {
  if (jwt) await SecureStore.setItemAsync(JWT_STORE_KEY, jwt);
}

function readCachedJwt() {
  return SecureStore.getItem(JWT_STORE_KEY);
}

function isJwtValid(jwt) {
  if (!jwt) return false;
  try {
    const parts = jwt.split(".");
    if (parts.length < 2) return false;
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
    if (!payload.exp) return true;
    return payload.exp * 1000 > Date.now() + 60_000;
  } catch {
    return false;
  }
}

// OTP response shape from Better Auth
const otpResult = {
  token: "opaque_sess_abc123",
  user: { id: "u1", email: "test@example.com", name: "Test" },
};

assert.equal(await persistAuthSession(otpResult), true);

// Simulate JWT exchange result
const fakeJwt =
  "eyJhbGciOiJFZERTQSJ9." +
  Buffer.from(
    JSON.stringify({ sub: "u1", exp: Math.floor(Date.now() / 1000) + 3600 }),
  ).toString("base64url") +
  ".signature";

await persistAuthJwt(fakeJwt);
assert.ok(isJwtValid(readCachedJwt()));
assert.ok(!isJwtValid("opaque_sess_abc123"), "opaque token must not pass as JWT");

console.log("auth session + JWT smoke test: OK");
