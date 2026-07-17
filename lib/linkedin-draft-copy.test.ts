import assert from "node:assert/strict";

import {
  buildLinkedinCta,
  buildLinkedinHook,
  buildLinkedinLocaleCopy,
  firstSentence,
} from "@/lib/linkedin-draft-copy";

function run() {
  assert.equal(
    firstSentence("Fresher ops data matters. CDC closes the gap."),
    "Fresher ops data matters.",
  );

  const title = "Agentic Databases Explained: AI Creates 4x More DBs Than Engineers";
  const excerpt =
    "Agentic databases with sub-10-second lifespans now dominate Lakebase. Discover strategies to manage faster iteration.";

  const hookEn = buildLinkedinHook({
    locale: "en",
    sourceType: "article",
    title,
    excerpt,
  });

  assert.notEqual(hookEn, title);
  assert.equal(hookEn, "Agentic databases with sub-10-second lifespans now dominate Lakebase.");

  const titleOnlyHook = buildLinkedinHook({
    locale: "en",
    sourceType: "article",
    title,
    excerpt: title,
  });
  assert.notEqual(titleOnlyHook, title);
  assert.match(titleOnlyHook, /business pressure/i);

  const projectHookPt = buildLinkedinHook({
    locale: "pt",
    sourceType: "project",
    title: "Lakehouse Platform: Databricks on AWS",
    excerpt: "Lakehouse Platform: Databricks on AWS",
  });
  assert.match(projectHookPt, /pressão real de entrega/i);

  const articleCta = buildLinkedinCta({
    locale: "en",
    sourceType: "article",
    hasProof: true,
  });
  assert.match(articleCta, /full article/i);
  assert.match(articleCta, /GitHub/i);
  assert.doesNotMatch(articleCta, /full story on the site and use GitHub as the operational proof point/i);

  const projectCta = buildLinkedinCta({
    locale: "pt",
    sourceType: "project",
    hasProof: false,
  });
  assert.match(projectCta, /case do projeto/i);

  const copy = buildLinkedinLocaleCopy({
    locale: "en",
    sourceType: "article",
    title,
    excerpt,
    hasProof: true,
  });
  assert.equal(copy.hook, hookEn);
  assert.match(copy.body, /Operational proof/i);
  assert.equal(copy.cta, articleCta);

  console.log("linkedin-draft-copy.test.ts: all assertions passed");
}

run();
