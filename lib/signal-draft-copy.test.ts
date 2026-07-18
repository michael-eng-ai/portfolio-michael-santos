import assert from "node:assert/strict";

import {
  buildSignalCta,
  buildSignalHook,
  buildSignalLocaleCopy,
  buildSignalXPosts,
  inferSignalStake,
  isForbiddenSeoHook,
} from "@/lib/signal-draft-copy";
import { linkedinDraftSchema, xDraftSchema } from "@/lib/content";

function run() {
  assert.equal(isForbiddenSeoHook("Learn how to tune pgvector"), true);
  assert.equal(isForbiddenSeoHook("Veja como escalar RAG"), true);
  assert.equal(isForbiddenSeoHook("Someone on GitHub just challenged the default stack around e-sign."), false);

  const hookEn = buildSignalHook({
    locale: "en",
    subject: "DocuSeal",
    stake: "open-source",
    nicheAngle: "Open-source e-sign shifts cost away from incumbents.",
    marketFrame: "e-sign lock-in",
  });
  assert.match(hookEn, /GitHub/i);
  assert.doesNotMatch(hookEn, /^Learn how/i);

  const hookPt = buildSignalHook({
    locale: "pt",
    subject: "pgvector",
    stake: "latency",
    nicheAngle: "HNSW mal tunado queima latência de retrieval em produção.",
  });
  assert.match(hookPt, /Latência/i);
  assert.doesNotMatch(hookPt, /^Veja como/i);

  const copy = buildSignalLocaleCopy({
    locale: "en",
    subject: "dbt Fusion",
    stake: "cost",
    nicheAngle: "Incremental compile cost still decides whether analytics engineering scales.",
    hasProof: true,
    hasSiteUrl: true,
  });
  assert.equal(copy.hook, buildSignalHook({
    locale: "en",
    subject: "dbt Fusion",
    stake: "cost",
    nicheAngle: "Incremental compile cost still decides whether analytics engineering scales.",
  }));
  assert.doesNotMatch(copy.cta, /Learn how/i);
  assert.match(copy.body, /dbt Fusion/);

  const ctaPt = buildSignalCta({ locale: "pt", hasProof: true, hasSiteUrl: false });
  assert.match(ctaPt, /Prova no link/i);

  const xPosts = buildSignalXPosts({
    locale: "en",
    subject: "Iceberg REST catalog",
    stake: "risk",
    nicheAngle: "Multi-engine consistency fails when the catalog contract is fuzzy.",
    hasProof: true,
    proofUrl: "https://github.com/example/iceberg",
  });
  assert.equal(xPosts.length, 3);
  assert.match(xPosts[0], /risk|production/i);
  assert.match(xPosts[2], /github\.com\/example\/iceberg/i);

  assert.equal(inferSignalStake(["open-source", "kafka"]), "open-source");
  assert.equal(inferSignalStake(["finops"], "warehouse bill shock"), "cost");
  assert.equal(inferSignalStake(["rag"], "hnsw latency"), "latency");

  const signalDraft = linkedinDraftSchema.parse({
    slug: "signal-docuseal-oss",
    sourceType: "signal",
    sourceSlug: "docuseal-oss",
    status: "draft",
    generatedAt: new Date().toISOString(),
    publishedUrl: null,
    mediaPath: "/images/social/2026-07-17-docuseal.png",
    mediaSource: "screenshot",
    urls: {
      en: "https://michael.business/en",
      pt: "https://michael.business/pt",
      proof: "https://github.com/docusealco/docuseal",
    },
    locales: {
      en: copy,
      pt: buildSignalLocaleCopy({
        locale: "pt",
        subject: "DocuSeal",
        stake: "open-source",
        nicheAngle: "E-sign open source muda a conta de vendor lock-in.",
        hasProof: true,
        hasSiteUrl: true,
      }),
    },
  });
  assert.equal(signalDraft.sourceType, "signal");
  assert.equal(signalDraft.mediaSource, "screenshot");

  const xDraft = xDraftSchema.parse({
    slug: "signal-docuseal-oss",
    sourceType: "signal",
    sourceSlug: "docuseal-oss",
    status: "draft",
    generatedAt: new Date().toISOString(),
    publishedUrl: null,
    mediaPath: "/images/social/2026-07-17-docuseal.png",
    mediaSource: "screenshot",
    urls: {
      en: "https://michael.business/en",
      pt: "https://michael.business/pt",
      proof: "https://github.com/docusealco/docuseal",
    },
    locales: {
      en: { posts: xPosts },
      pt: {
        posts: buildSignalXPosts({
          locale: "pt",
          subject: "DocuSeal",
          stake: "open-source",
          nicheAngle: "E-sign open source muda a conta de vendor lock-in.",
          hasProof: true,
          proofUrl: "https://github.com/docusealco/docuseal",
        }),
      },
    },
  });
  assert.equal(xDraft.sourceType, "signal");

  console.log("signal-draft-copy.test.ts: all assertions passed");
}

run();
