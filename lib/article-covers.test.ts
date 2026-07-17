import assert from "node:assert/strict";

import {
  isGenericSvgCover,
  isRasterArticleCover,
} from "@/lib/article-covers";
import { resolveSocialShareImage } from "@/lib/seo";

function run() {
  assert.equal(isRasterArticleCover("/images/articles/foo.jpg"), true);
  assert.equal(isRasterArticleCover("/images/articles/foo.png"), true);
  assert.equal(isRasterArticleCover("/images/articles/foo.svg"), false);
  assert.equal(isGenericSvgCover("/images/articles/platform-modernization-patterns.svg"), true);
  assert.equal(isGenericSvgCover(undefined), true);

  assert.equal(resolveSocialShareImage("/images/articles/foo.jpg"), "/images/articles/foo.jpg");
  assert.equal(resolveSocialShareImage("/images/articles/foo.svg"), null);
  assert.equal(resolveSocialShareImage(undefined), null);

  console.log("article-covers.test.ts: all assertions passed");
}

run();
