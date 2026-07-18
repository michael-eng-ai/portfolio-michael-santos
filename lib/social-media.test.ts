import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  isSocialScreenshotPath,
  resolvePublicMediaPath,
  resolveSocialPublishMediaPath,
  shouldUploadSocialImage,
} from "@/lib/social-media";

async function withTempPublic(run: (root: string) => Promise<void>) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "social-media-"));
  const previousCwd = process.cwd();
  try {
    await fs.mkdir(path.join(root, "public", "images", "social"), { recursive: true });
    await fs.mkdir(path.join(root, "public", "images", "articles"), { recursive: true });
    process.chdir(root);
    await run(root);
  } finally {
    process.chdir(previousCwd);
    await fs.rm(root, { recursive: true, force: true });
  }
}

async function run() {
  assert.equal(isSocialScreenshotPath("/images/social/foo.png"), true);
  assert.equal(isSocialScreenshotPath("/images/articles/foo.png"), false);
  assert.equal(isSocialScreenshotPath("/images/social/foo.svg"), false);

  await withTempPublic(async () => {
    const screenshotRel = "/images/social/2026-07-17-demo.png";
    const articleRel = "/images/articles/demo-article.png";
    await fs.writeFile(path.join(process.cwd(), "public", screenshotRel.replace(/^\//, "")), "png");
    await fs.writeFile(path.join(process.cwd(), "public", articleRel.replace(/^\//, "")), "png");

    assert.ok(resolvePublicMediaPath(screenshotRel));
    assert.equal(resolvePublicMediaPath("/images/social/missing.png"), null);

    const signalPath = resolveSocialPublishMediaPath({
      sourceType: "signal",
      sourceSlug: "demo",
      mediaPath: screenshotRel,
      mediaSource: "screenshot",
    });
    assert.ok(signalPath?.endsWith(path.join("public", "images", "social", "2026-07-17-demo.png")));

    // Signals must not fall back to article AI covers when screenshot is missing.
    assert.equal(
      resolveSocialPublishMediaPath({
        sourceType: "signal",
        sourceSlug: "demo-article",
        mediaPath: "/images/social/missing.png",
        mediaSource: "screenshot",
      }),
      null,
    );

    const articlePath = resolveSocialPublishMediaPath({
      sourceType: "article",
      sourceSlug: "demo-article",
      mediaPath: articleRel,
      mediaSource: "ai",
    });
    assert.ok(articlePath?.includes(path.join("images", "articles", "demo-article.png")));

    assert.equal(
      shouldUploadSocialImage({
        sourceType: "signal",
        sourceSlug: "demo",
        mediaPath: screenshotRel,
        mediaSource: "screenshot",
      }),
      true,
    );

    assert.equal(
      resolveSocialPublishMediaPath({
        sourceType: "article",
        sourceSlug: "demo-article",
        mediaPath: articleRel,
        mediaSource: "none",
      }),
      null,
    );
  });

  console.log("social-media.test.ts: all assertions passed");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
