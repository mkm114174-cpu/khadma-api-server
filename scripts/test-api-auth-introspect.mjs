#!/usr/bin/env node
/**
 * Verify API auth accepts JWT issuers and introspects opaque tokens.
 */
import assert from "node:assert/strict";

function jwtIssuers(base) {
  const origin = new URL(base).origin;
  return base === origin ? [base] : [base, origin];
}

const neonBase =
  "https://ep-green-brook-aso0ob6f.neonauth.c-4.eu-central-1.aws.neon.tech/neondb/auth";

const issuers = jwtIssuers(neonBase);
assert.ok(issuers.includes(neonBase));
assert.ok(issuers.includes(new URL(neonBase).origin));

const res = await fetch(`${neonBase}/get-session`, {
  headers: { Authorization: "Bearer invalid_test", Accept: "application/json" },
});
assert.equal(res.status, 200);
const body = await res.json();
assert.equal(body, null, "invalid bearer should return null session");

console.log("api neon auth introspect smoke: OK");
