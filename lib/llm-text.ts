import { GoogleGenAI, type Schema } from "@google/genai";
import OpenAI from "openai";

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
/** Developer-tier Groq chat model. llama-3.3-70b-versatile is enterprise-only and 404s. */
export const DEFAULT_GROQ_MODEL = "openai/gpt-oss-120b";
/** Used when GROQ_MODEL returns 404. llama-* ids are never accepted here. */
export const DEFAULT_GROQ_FALLBACK_MODEL = "openai/gpt-oss-20b";
const DEFAULT_GROQ_BASE_URL = "https://api.groq.com/openai/v1";
/**
 * GPT-OSS counts reasoning tokens against max_completion_tokens.
 * This reserve sits on top of the caller's answer budget.
 */
const GPT_OSS_REASONING_HEADROOM = 1024;

export type LlmProvider = "gemini" | "groq";

export type GenerateTextOptions = {
  prompt: string;
  systemInstruction?: string;
  maxTokens?: number;
  temperature?: number;
  /** Override automatic provider resolution. */
  provider?: LlmProvider;
  /** Override the model. Defaults: gemini-2.5-flash | openai/gpt-oss-120b */
  model?: string;
  /**
   * Optional schema enforcement. When provided AND provider is "gemini",
   * Gemini's responseSchema is used so the model is forced to emit
   * schema-conforming JSON. Groq receives a JSON response-format hint.
   */
  responseSchema?: Schema;
};

export type GenerateTextResult = {
  text: string;
  provider: LlmProvider;
  model: string;
};

/**
 * Resolves the LLM provider to use, in priority order:
 *   1. options.provider (explicit override)
 *   2. process.env.LLM_PROVIDER (deployment-time override)
 *   3. GEMINI_API_KEY presence
 *   4. GROQ_API_KEY presence
 */
export function resolveLlmProvider(override?: LlmProvider): LlmProvider {
  if (override) return override;

  const envProvider = process.env.LLM_PROVIDER?.toLowerCase();
  if (envProvider === "gemini" || envProvider === "groq") {
    return envProvider;
  }

  if (envProvider === "anthropic") {
    throw new Error("Unsupported LLM_PROVIDER. Set LLM_PROVIDER=gemini or LLM_PROVIDER=groq.");
  }

  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.GROQ_API_KEY) return "groq";

  throw new Error(
    "No LLM provider configured. Set GEMINI_API_KEY or GROQ_API_KEY (or LLM_PROVIDER=gemini|groq).",
  );
}

function hasProviderKey(provider: LlmProvider): boolean {
  return provider === "gemini"
    ? Boolean(process.env.GEMINI_API_KEY)
    : Boolean(process.env.GROQ_API_KEY);
}

function getProviderPlan(preferred: LlmProvider, allowFallback: boolean): LlmProvider[] {
  const fallbackOrder: LlmProvider[] = ["gemini", "groq"];
  const providers = allowFallback
    ? [preferred, ...fallbackOrder.filter((provider) => provider !== preferred)]
    : [preferred];

  return providers.filter((provider) => hasProviderKey(provider));
}

export function isModelNotFoundError(error: unknown): boolean {
  if (error && typeof error === "object") {
    const record = error as { status?: unknown; code?: unknown; name?: unknown };
    if (record.status === 404 || record.code === "model_not_found" || record.name === "NotFoundError") {
      return true;
    }
  }

  const message = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return (
    message.includes("404") ||
    message.includes("does not exist") ||
    message.includes("model_not_found")
  );
}

/** True for Groq llama ids, including meta-llama/*. Those models 404 on developer keys. */
export function isGroqLlamaModel(model: string): boolean {
  const name = model.trim().toLowerCase().split("/").pop() ?? "";
  return name.startsWith("llama");
}

function configuredGroqModel(envValue: string | undefined, fallback: string, envName: string): string {
  const configured = envValue?.trim();
  if (!configured) return fallback;
  if (!isGroqLlamaModel(configured)) return configured;

  console.warn(
    `[llm] ${envName}=${configured} is enterprise-only on Groq and is not used. Using ${fallback}.`,
  );
  return fallback;
}

/**
 * Groq models to call, in order. GROQ_MODEL then GROQ_FALLBACK_MODEL.
 * An explicit non-llama options.model is used alone. llama-* ids are dropped.
 */
export function groqModelsToTry(explicitModel?: string): string[] {
  const pinned = explicitModel?.trim();
  if (pinned && !isGroqLlamaModel(pinned)) return [pinned];
  if (pinned && isGroqLlamaModel(pinned)) {
    console.warn(`[llm] Refusing llama model ${pinned}. Using the GPT-OSS defaults.`);
  }

  const primary = configuredGroqModel(process.env.GROQ_MODEL, DEFAULT_GROQ_MODEL, "GROQ_MODEL");
  const secondary = configuredGroqModel(
    process.env.GROQ_FALLBACK_MODEL,
    DEFAULT_GROQ_FALLBACK_MODEL,
    "GROQ_FALLBACK_MODEL",
  );
  return [...new Set([primary, secondary])];
}

export function groqCompletionOptions(model: string, maxTokens: number): {
  max_tokens?: number;
  max_completion_tokens?: number;
  reasoning_effort?: "low";
  include_reasoning?: false;
} {
  if (model.startsWith("openai/gpt-oss")) {
    return {
      max_completion_tokens: maxTokens + GPT_OSS_REASONING_HEADROOM,
      reasoning_effort: "low",
      include_reasoning: false,
    };
  }

  return { max_tokens: maxTokens };
}

/** Final answer only. GPT-OSS reasoning stays in message.reasoning and is ignored. */
export function groqFinalContent(message: { content?: string | null } | null | undefined): string {
  const raw = typeof message?.content === "string" ? message.content : "";
  return raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

function isFallbackEligibleError(error: unknown): boolean {
  if (isModelNotFoundError(error)) return true;

  const message = error instanceof Error
    ? `${error.name} ${error.message}`.toLowerCase()
    : String(error).toLowerCase();

  return (
    message.includes("429") ||
    message.includes("529") ||
    message.includes("503") ||
    message.includes("rate limit") ||
    message.includes("quota") ||
    message.includes("tokens per day") ||
    message.includes("overloaded") ||
    message.includes("timeout") ||
    message.includes("unavailable")
  );
}

/**
 * True when an error indicates the configured LLM provider(s) are unavailable
 * because of capacity, rate limits, quota exhaustion, or billing suspension —
 * a transient "try again later" condition, not a code bug. Scheduled content
 * scripts use this to skip gracefully (exit 0) instead of failing and opening a
 * failure issue every run while the providers are out.
 *
 * Intentionally omits bare "timeout" so a database/network timeout is not
 * mistaken for an LLM outage.
 */
export function isLlmUnavailableError(error: unknown): boolean {
  const message = (error instanceof Error ? error.message : String(error)).toLowerCase();

  return (
    message.includes("429") ||
    message.includes("503") ||
    message.includes("529") ||
    message.includes("rate limit") ||
    message.includes("quota") ||
    message.includes("tokens per day") ||
    message.includes("overloaded") ||
    message.includes("high demand") ||
    message.includes("unavailable") ||
    message.includes("suspended") ||
    message.includes("insufficient balance")
  );
}

async function generateWithGemini(
  options: GenerateTextOptions,
  model: string,
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set; cannot use the Gemini provider.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model,
    contents: options.prompt,
    config: {
      ...(options.systemInstruction
        ? { systemInstruction: options.systemInstruction }
        : {}),
      ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
      ...(options.maxTokens !== undefined ? { maxOutputTokens: options.maxTokens } : {}),
      ...(options.responseSchema
        ? {
            responseMimeType: "application/json",
            responseSchema: options.responseSchema,
          }
        : {}),
    },
  });

  const text = response.text;
  const fallbackText = response.candidates?.[0]?.content?.parts
    ?.map((part) => "text" in part ? part.text : "")
    .filter(Boolean)
    .join("");

  if (!text && !fallbackText) {
    throw new Error("Gemini response did not contain text content.");
  }
  return text ?? fallbackText ?? "";
}

async function generateWithGroq(
  options: GenerateTextOptions,
): Promise<{ text: string; model: string }> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set; cannot use the Groq provider.");
  }

  const client = new OpenAI({
    apiKey,
    baseURL: process.env.GROQ_BASE_URL || DEFAULT_GROQ_BASE_URL,
  });

  const messages: { role: "system" | "user"; content: string }[] = [];
  if (options.systemInstruction) {
    messages.push({ role: "system", content: options.systemInstruction });
  }
  messages.push({ role: "user", content: options.prompt });

  const models = groqModelsToTry(options.model);
  const maxTokens = options.maxTokens ?? 1024;
  let lastError: unknown;

  for (let index = 0; index < models.length; index += 1) {
    const model = models[index];
    try {
      const completion = await client.chat.completions.create({
        model,
        ...groqCompletionOptions(model, maxTokens),
        ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
        ...(options.responseSchema
          ? { response_format: { type: "json_object" as const } }
          : {}),
        messages,
      });

      const content = groqFinalContent(completion.choices[0]?.message);
      if (!content) {
        throw new Error("Groq response did not contain text content.");
      }
      return { text: content, model };
    } catch (error) {
      lastError = error;
      const nextModel = models[index + 1];
      if (nextModel && isModelNotFoundError(error)) {
        console.warn(`[llm] Groq model ${model} returned 404; trying ${nextModel}.`);
        continue;
      }
      throw error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Groq request failed.");
}

/**
 * Single entry point for plain text generation across providers.
 * Returns the generated text alongside which provider/model handled it.
 */
export async function generateText(
  options: GenerateTextOptions,
): Promise<GenerateTextResult> {
  const provider = resolveLlmProvider(options.provider);
  const pinnedModel = options.model?.trim();
  const modelIsPinned = Boolean(pinnedModel) && !isGroqLlamaModel(pinnedModel ?? "");
  const providerPlan = getProviderPlan(provider, !options.provider && !modelIsPinned);
  const errors: string[] = [];

  for (const targetProvider of providerPlan) {
    try {
      if (targetProvider === "gemini") {
        const model = (modelIsPinned ? pinnedModel : undefined) ?? DEFAULT_GEMINI_MODEL;
        const text = await generateWithGemini(options, model);
        return { text, provider: targetProvider, model };
      }

      const result = await generateWithGroq(options);
      return { text: result.text, provider: targetProvider, model: result.model };
    } catch (error) {
      errors.push(`${targetProvider}: ${error instanceof Error ? error.message : String(error)}`);

      if (!isFallbackEligibleError(error)) {
        throw error;
      }

      console.warn(`[llm] provider ${targetProvider} failed with a retryable error; trying fallback provider if available.`);
    }
  }

  throw new Error(`All configured LLM providers failed. ${errors.join(" | ")}`);
}
