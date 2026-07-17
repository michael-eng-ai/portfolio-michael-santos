import assert from "node:assert/strict";

import { buildXHook, buildXThreadPosts } from "@/lib/x-draft-copy";

function run() {
  const title = "dbt Fusion Engine vs SQLMesh Incremental Cost Patterns";
  const excerpt =
    "Warehouse bills spike when full refreshes sneak into CI. Compare incremental cost patterns before the next invoice lands.";

  const hook = buildXHook({
    locale: "en",
    sourceType: "article",
    title,
    excerpt,
  });

  assert.notEqual(hook, title);
  assert.match(hook, /Warehouse bills spike/i);

  const posts = buildXThreadPosts({
    locale: "en",
    sourceType: "article",
    title,
    excerpt,
    hasProof: true,
  });

  assert.equal(posts.length, 3);
  assert.equal(posts[0], hook);
  assert.notEqual(posts[0], title);
  assert.match(posts[2], /GitHub/i);

  const titleOnly = buildXHook({
    locale: "pt",
    sourceType: "article",
    title,
    excerpt: title,
  });
  assert.notEqual(titleOnly, title);
  assert.match(titleOnly, /press[aã]o/i);

  console.log("x-draft-copy.test.ts: all assertions passed");
}

run();
