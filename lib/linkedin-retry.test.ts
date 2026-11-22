import assert from "node:assert/strict";

import {
  isRetryableLinkedinPublishError,
  LinkedinHttpError,
  linkedinPostIdFromCreateResponse,
} from "@/lib/linkedin-retry";

const CREATED_URN = "urn:li:share:7505574015986569217";

function run() {
  const createdId = linkedinPostIdFromCreateResponse(201, CREATED_URN);
  assert.equal(createdId, CREATED_URN);
  assert.equal(linkedinPostIdFromCreateResponse(200, "  "), "unknown");
  assert.equal(linkedinPostIdFromCreateResponse(204, null), "unknown");

  const createdMessage = new Error(`LinkedIn API 201: ${CREATED_URN}`);
  assert.equal(createdMessage.message.includes("5"), true);
  assert.equal(isRetryableLinkedinPublishError(createdMessage), false);
  assert.equal(
    isRetryableLinkedinPublishError(new LinkedinHttpError(201, CREATED_URN)),
    false
  );

  assert.equal(
    isRetryableLinkedinPublishError(new LinkedinHttpError(429, "rate limit")),
    true
  );
  assert.equal(
    isRetryableLinkedinPublishError(new Error("LinkedIn API 500: upstream")),
    true
  );
  assert.equal(
    isRetryableLinkedinPublishError(new LinkedinHttpError(503, "unavailable")),
    true
  );
  assert.equal(
    isRetryableLinkedinPublishError(new LinkedinHttpError(599, "edge")),
    true
  );

  const clientError = new LinkedinHttpError(400, "limit 500 and digit 5");
  assert.equal(clientError.message.includes("5"), true);
  assert.equal(isRetryableLinkedinPublishError(clientError), false);
  assert.equal(
    isRetryableLinkedinPublishError(new LinkedinHttpError(418, "teapot")),
    false
  );
  assert.equal(isRetryableLinkedinPublishError(new Error("5")), false);
  assert.equal(isRetryableLinkedinPublishError(new Error("503")), false);
  assert.equal(isRetryableLinkedinPublishError(new Error(CREATED_URN)), false);

  assert.throws(
    () => linkedinPostIdFromCreateResponse(500, null, "upstream"),
    (error: unknown) => {
      assert.ok(error instanceof LinkedinHttpError);
      assert.equal(error.status, 500);
      assert.equal(isRetryableLinkedinPublishError(error), true);
      return true;
    }
  );

  assert.throws(
    () => linkedinPostIdFromCreateResponse(400, CREATED_URN, "rejected 500"),
    (error: unknown) => {
      assert.equal(isRetryableLinkedinPublishError(error), false);
      return true;
    }
  );

  const reset = new Error("fetch failed", {
    cause: Object.assign(new Error("socket hang up"), { code: "ECONNRESET" }),
  });
  assert.equal(isRetryableLinkedinPublishError(reset), true);
  assert.equal(
    isRetryableLinkedinPublishError(
      new Error("The operation was aborted due to timeout")
    ),
    true
  );
  assert.equal(
    isRetryableLinkedinPublishError(
      Object.assign(new Error("connect failed"), {
        code: "UND_ERR_CONNECT_TIMEOUT",
      })
    ),
    true
  );
  assert.equal(
    isRetryableLinkedinPublishError(new Error("The operation was aborted")),
    false
  );

  console.log("linkedin-retry.test.ts: ok");
}

run();
