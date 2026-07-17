import assert from "node:assert/strict";

import {
  buildLocalizedSiteUrl,
  resolveSocialLocale,
  withSocialUtm,
} from "@/lib/utm";

function run() {
  const withParams = withSocialUtm("https://michael.business/en/news/demo-slug", {
    source: "x",
    campaign: "demo-slug",
    content: "en",
  });

  assert.equal(
    withParams,
    "https://michael.business/en/news/demo-slug?utm_source=x&utm_medium=social&utm_campaign=demo-slug&utm_content=en",
  );

  const linkedin = withSocialUtm("https://michael.business/pt/articles/foo?ref=1", {
    source: "linkedin",
    campaign: "Foo Bar!",
    content: "pt",
  });

  const linkedinUrl = new URL(linkedin);
  assert.equal(linkedinUrl.searchParams.get("utm_source"), "linkedin");
  assert.equal(linkedinUrl.searchParams.get("utm_medium"), "social");
  assert.equal(linkedinUrl.searchParams.get("utm_campaign"), "foo-bar");
  assert.equal(linkedinUrl.searchParams.get("utm_content"), "pt");
  assert.equal(linkedinUrl.searchParams.get("ref"), "1");

  assert.equal(resolveSocialLocale("pt"), "pt");
  assert.equal(resolveSocialLocale("de", "en"), "en");

  assert.equal(
    buildLocalizedSiteUrl({
      locale: "pt",
      path: "/news/abc",
      source: "linkedin",
      campaign: "abc",
    }),
    "https://michael.business/pt/news/abc?utm_source=linkedin&utm_medium=social&utm_campaign=abc&utm_content=pt",
  );

  console.log("utm.test.ts: all assertions passed");
}

run();
