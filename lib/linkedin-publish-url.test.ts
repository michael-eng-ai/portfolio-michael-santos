import assert from "node:assert/strict";

import { buildLinkedinPublishedUrl, publishLinkedinDraft, requiresLinkedinEditorialApproval } from "@/lib/linkedin";

import type { LinkedinDraft } from "@/lib/content";

async function run() {
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
  for (const sourceType of ["article", "signal"] as const) {
    assert.equal(requiresLinkedinEditorialApproval({ sourceType, status: "draft" }), true);
    assert.equal(requiresLinkedinEditorialApproval({ sourceType, status: "approved" }), false);
  }
  assert.equal(requiresLinkedinEditorialApproval({ sourceType: "project", status: "draft" }), false);

  // The shared publisher (also used by the API route) must stop an unapproved
  // article before inspecting metadata, credentials or sending a request.
  const result = await publishLinkedinDraft({ sourceType: "article", status: "draft" } as LinkedinDraft);
  assert.equal(result.published, false);
  assert.match("reason" in result ? result.reason : "", /requires? editorial approval/i);
  console.log("linkedin-publish-url.test.ts: ok");
}

await run();
