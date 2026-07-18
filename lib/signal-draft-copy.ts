import { Locale } from "@/lib/site";

export type SignalStake = "cost" | "risk" | "latency" | "adoption" | "open-source";

export type SignalHookInput = {
  locale: Locale;
  /** Tool, repo, or news subject name — not an SEO title. */
  subject: string;
  stake: SignalStake;
  /** One-sentence DE/AI angle for why this belongs on the feed. */
  nicheAngle: string;
  /** Optional market / incumbent framing for the hook. */
  marketFrame?: string;
};

const FORBIDDEN_HOOK_PATTERNS: RegExp[] = [
  /^\s*learn how\b/i,
  /^\s*veja como\b/i,
  /^\s*in this article\b/i,
  /^\s*neste artigo\b/i,
  /^\s*new article\b/i,
  /^\s*excited to share\b/i,
  /^\s*check out (my|our)\b/i,
];

export function isForbiddenSeoHook(hook: string): boolean {
  const trimmed = hook.trim();
  if (!trimmed) {
    return true;
  }

  return FORBIDDEN_HOOK_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function normalizeSubject(subject: string): string {
  return subject.replace(/\s+/g, " ").trim();
}

/**
 * Curiosity + stakes hook for LinkedIn/X signal posts.
 * Distinct from SEO article promo hooks (`buildLinkedinHook` / "Learn how…").
 * See docs/SOCIAL_SIGNAL_PLAYBOOK.md prompt pack.
 */
export function buildSignalHook(input: SignalHookInput): string {
  const subject = normalizeSubject(input.subject);
  const market = normalizeSubject(input.marketFrame ?? subject);
  const { locale, stake } = input;

  let hook: string;

  if (locale === "pt") {
    switch (stake) {
      case "open-source":
        hook = `Alguém no GitHub desafiou o default de ${market}.`;
        break;
      case "cost":
        hook = `A maioria ainda paga caro por um problema que ${subject} resolve de outro jeito.`;
        break;
      case "risk":
        hook = `${subject}: o risco não está no hype — está no que quebra em produção.`;
        break;
      case "latency":
        hook = `Latência e custo de recuperação: ${subject} muda a conta operacional.`;
        break;
      case "adoption":
      default:
        hook = `A adoção de ${subject} está na frente da maturidade de dados da maioria dos times.`;
        break;
    }
  } else {
    switch (stake) {
      case "open-source":
        hook = `Someone on GitHub just challenged the default stack around ${market}.`;
        break;
      case "cost":
        hook = `Most teams still pay for a problem ${subject} already reframes.`;
        break;
      case "risk":
        hook = `${subject}: the risk is not the hype cycle — it is what fails in production.`;
        break;
      case "latency":
        hook = `Latency and recovery cost: ${subject} changes the operational math.`;
        break;
      case "adoption":
      default:
        hook = `${subject} adoption is running ahead of most teams' data maturity.`;
        break;
    }
  }

  if (isForbiddenSeoHook(hook)) {
    throw new Error(`Generated forbidden SEO-style signal hook: ${hook}`);
  }

  return hook;
}

export function buildSignalBody({
  locale,
  subject,
  nicheAngle,
  stake,
}: {
  locale: Locale;
  subject: string;
  nicheAngle: string;
  stake: SignalStake;
}): string {
  const cleanedAngle = nicheAngle.replace(/\s+/g, " ").trim();
  const name = normalizeSubject(subject);

  if (locale === "pt") {
    const stakeLine =
      stake === "open-source"
        ? `${name} é o tipo de prova open-source que engenharia de dados deveria inspecionar antes de renovar vendor.`
        : stake === "cost"
          ? `Para plataformas de dados/IA, o stake é custo de plataforma — não só feature list.`
          : stake === "risk"
            ? `O ângulo de DE/AI é falha operacional: drift, retrieval frágil, orquestração sem guardrails.`
            : stake === "latency"
              ? `O custo escondido aparece em latência de pipeline e tempo até recovery — não no slide de arquitetura.`
              : `O gap de adoção costuma ser fundação de dados, não modelo.`;

    return `${name}: ${cleanedAngle}\n\n${stakeLine}`;
  }

  const stakeLine =
    stake === "open-source"
      ? `${name} is the kind of open-source proof data engineers should inspect before renewing a vendor.`
      : stake === "cost"
        ? `For data/AI platforms, the stake is platform cost — not just the feature list.`
        : stake === "risk"
          ? `The DE/AI angle is operational failure: drift, brittle retrieval, orchestration without guardrails.`
          : stake === "latency"
            ? `The hidden cost shows up in pipeline latency and time-to-recovery — not the architecture slide.`
            : `The adoption gap is usually a data foundation problem, not a model problem.`;

  return `${name}: ${cleanedAngle}\n\n${stakeLine}`;
}

export function buildSignalCta({
  locale,
  hasProof,
  hasSiteUrl,
}: {
  locale: Locale;
  hasProof: boolean;
  hasSiteUrl: boolean;
}): string {
  if (locale === "pt") {
    if (hasProof && hasSiteUrl) {
      return "Curioso como você implementaria isso? Prova no link + breakdown no site.";
    }
    if (hasProof) {
      return "Prova no link — me diga como você atacaria isso no seu stack.";
    }
    return "Como você encaixa isso na sua plataforma de dados/IA?";
  }

  if (hasProof && hasSiteUrl) {
    return "Curious how you'd implement this? Proof in the link + breakdown on the site.";
  }
  if (hasProof) {
    return "Proof in the link — tell me how you'd attack this in your stack.";
  }
  return "How would you fit this into your data/AI platform?";
}

export function buildSignalLocaleCopy(input: SignalHookInput & { hasProof: boolean; hasSiteUrl: boolean }) {
  return {
    hook: buildSignalHook(input),
    body: buildSignalBody({
      locale: input.locale,
      subject: input.subject,
      nicheAngle: input.nicheAngle,
      stake: input.stake,
    }),
    cta: buildSignalCta({
      locale: input.locale,
      hasProof: input.hasProof,
      hasSiteUrl: input.hasSiteUrl,
    }),
  };
}

export function buildSignalXPosts(input: SignalHookInput & { hasProof: boolean; proofUrl?: string | null }) {
  const hook = buildSignalHook(input);
  const angle = input.nicheAngle.replace(/\s+/g, " ").trim();
  const third =
    input.locale === "pt"
      ? input.hasProof
        ? "Prova no link:"
        : "O que você mudaria no stack?"
      : input.hasProof
        ? "Proof:"
        : "What would you change in the stack?";

  const posts = [hook, angle, third];
  if (input.hasProof && input.proofUrl) {
    posts[2] = `${third} ${input.proofUrl}`;
  }
  return posts;
}

/** Infer a stake label from tags / free text for draft generation. */
export function inferSignalStake(tags: string[], text = ""): SignalStake {
  const haystack = `${tags.join(" ")} ${text}`.toLowerCase();

  if (/\b(open.?source|oss|github|apache|license)\b/.test(haystack)) {
    return "open-source";
  }
  if (/\b(cost|finops|pricing|bill|spend|expensive)\b/.test(haystack)) {
    return "cost";
  }
  if (/\b(latency|sla|throughput|performance|hnsw|shuffle)\b/.test(haystack)) {
    return "latency";
  }
  if (/\b(risk|security|drift|fail|outage|incident|governance)\b/.test(haystack)) {
    return "risk";
  }
  return "adoption";
}
