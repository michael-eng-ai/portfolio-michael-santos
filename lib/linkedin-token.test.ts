import assert from "node:assert/strict";

import {
  describeLinkedInTokenFailure,
  inspectLinkedInAccessToken,
  readLinkedInJwtExpiryMs,
} from "@/lib/linkedin-token";

function jwt(expSeconds: number): string {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ exp: expSeconds })).toString("base64url");
  return `${header}.${payload}.sig`;
}

async function run() {
  assert.equal(readLinkedInJwtExpiryMs("not-a-jwt"), null);
  assert.equal(readLinkedInJwtExpiryMs(jwt(1_700_000_000)), 1_700_000_000_000);

  const now = 1_700_000_000_000;
  const expired = await awaitInspect(jwt(1_699_000_000), now);
  assert.equal(expired.ok, false);
  assert.equal(expired.reason, "expired");

  const expiring = await awaitInspect(jwt(Math.floor((now + 60 * 60 * 1000) / 1000)), now);
  assert.equal(expiring.ok, false);
  assert.equal(expiring.reason, "expiring");

  const missing = await awaitInspect(undefined, now);
  assert.equal(missing.reason, "missing");
  assert.match(describeLinkedInTokenFailure("invalid"), /401/);
  assert.doesNotMatch(describeLinkedInTokenFailure("expiring"), /Bearer|AQX/);

  let sawAuthorization = false;
  const valid = await inspectLinkedInAccessToken("opaque-token-value", {
    now,
    fetchImpl: async (_url, init) => {
      const headers = new Headers(init?.headers);
      sawAuthorization = headers.get("Authorization") === "Bearer opaque-token-value";
      return new Response("{}", { status: 200 });
    },
  });
  assert.equal(valid.ok, true);
  assert.equal(sawAuthorization, true);

  const invalid = await inspectLinkedInAccessToken("opaque-token-value", {
    now,
    fetchImpl: async () => new Response("expired", { status: 401 }),
  });
  assert.equal(invalid.reason, "invalid");

  const scopeGap = await inspectLinkedInAccessToken("opaque-token-value", {
    now,
    fetchImpl: async () => new Response("forbidden", { status: 403 }),
  });
  assert.equal(scopeGap.ok, true);

  console.log("linkedin-token.test.ts: ok");
}

run().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

function awaitInspect(token: string | undefined, now: number) {
  return inspectLinkedInAccessToken(token, {
    now,
    fetchImpl: async () => {
      throw new Error("network should not be called");
    },
  });
}
