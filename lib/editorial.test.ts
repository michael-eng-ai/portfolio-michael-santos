import assert from "node:assert/strict";

import { clampText, toMetaDescription, toSocialTitle } from "@/lib/editorial";

function run() {
  const sliced =
    "When an 82-year-old Kentucky woman was offered $26 million from an AI company that wanted to build a data center on her land, she said no. Sure, that same company can try to rezone 2,000 acres nearby anyway, but as AI...";

  const description = toMetaDescription(sliced);
  assert.equal(
    description,
    "When an 82-year-old Kentucky woman was offered $26 million from an AI company that wanted to build a data center on her land, she said no.",
  );
  assert.ok(description.length >= 40 && description.length <= 200);
  assert.equal(description.includes("..."), false);

  const wordBound = toMetaDescription(
    "This signal explains why platform teams are revisiting contracts before the next planning cycle and what that means for delivery...",
  );
  assert.equal(wordBound.endsWith("..."), false);
  assert.equal(wordBound.split(" ").at(-1)?.includes("..."), false);
  assert.ok(wordBound.length <= 200);

  const complete =
    "As APIs de publicação do LinkedIn continuam exigindo revisão do app e acessos específicos.";
  assert.equal(toMetaDescription(complete), complete);
  assert.equal(
    toMetaDescription(
      "Databricks SQL opens up possibilities for almost everything we want to do. It’s the layer teams use when...",
    ),
    "Databricks SQL opens up possibilities for almost everything we want to do.",
  );

  assert.equal(
    toSocialTitle("InfoQ reforça evolução em arquitetura de software corpora..."),
    "InfoQ reforça evolução em arquitetura de software",
  );
  assert.equal(toSocialTitle("Título completo"), "Título completo");

  assert.equal(clampText("alpha beta gamma delta", 18), "alpha beta...");
  assert.equal(clampText("short", 12), "short");

  console.log("editorial.test.ts: all assertions passed");
}

run();
