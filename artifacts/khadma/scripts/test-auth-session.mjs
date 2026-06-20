#!/usr/bin/env node
/**
 * Smoke test for auth session persistence logic (Node shim for SecureStore).
 */
import assert from "node:assert/strict";

const store = new Map();

const SecureStore = {
  setItem(key, value) {
    store.set(key, value);
  },
  getItem(key) {
    return store.get(key) ?? null;
  },
};

// Inline minimal copy of authSession helpers for node test
const COOKIE_STORE_KEY = "khadma_cookie";
const SESSION_CACHE_KEY = "khadma_session_data";
const COOKIE_PREFIX = "better-auth";

function sessionToken(payload) {
  const fromSession = payload.session?.token;
  if (typeof fromSession === "string" && fromSession.length > 0) return fromSession;
  if (typeof payload.token === "string" && payload.token.length > 0) return payload.token;
  return null;
}

function persistAuthSession(payload) {
  const token = sessionToken(payload);
  const user = payload.user;
  if (!token || !user) return false;
  SecureStore.setItem(
    COOKIE_STORE_KEY,
    JSON.stringify({
      [`${COOKIE_PREFIX}.session_token`]: { value: token, expires: null },
    }),
  );
  SecureStore.setItem(
    SESSION_CACHE_KEY,
    JSON.stringify({ user, session: { token } }),
  );
  return true;
}

function readCachedSession() {
  const raw = SecureStore.getItem(SESSION_CACHE_KEY);
  if (!raw) return null;
  const parsed = JSON.parse(raw);
  const token = sessionToken(parsed);
  if (!token || !parsed.user) return null;
  return { user: parsed.user, session: { token } };
}

// Email OTP shape from Better Auth
const otpResult = {
  token: "sess_tok_abc123",
  user: { id: "u1", email: "test@example.com", name: "Test" },
};

assert.equal(persistAuthSession(otpResult), true);
const cached = readCachedSession();
assert.ok(cached);
assert.equal(cached.session.token, "sess_tok_abc123");
assert.equal(cached.user.email, "test@example.com");

console.log("auth session smoke test: OK");
