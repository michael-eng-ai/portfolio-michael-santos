import assert from "node:assert/strict";

import { buildLinkedinPublishedUrl } from "@/lib/linkedin";

function run() {
  assert.equal(buildLinkedinPublishedUrl(null), null);
  assert.equal(buildLinkedinPublishedUrl(""), null);
  assert.equal(buildLinkedinPublishedUrl("unknown"), null);
  assert.equal(
    buildLinkedinPublishedUrl("urn:li:ugcPost:123"),
    "https://www.linkedin.com/feed/update/urn%3Ali%3AugcPost%3A123",
  );
  assert.equal(
    buildLinkedinPublishedUrl("https://www.linkedin.com/feed/update/urn:li:ugcPost:9"),
    "https://www.linkedin.com/feed/update/urn:li:ugcPost:9",
  );
  console.log("linkedin-publish-url.test.ts: ok");
}

run();
