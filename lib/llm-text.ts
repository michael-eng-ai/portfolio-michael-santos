import { GoogleGenAI, type Schema } from "@google/genai";
import OpenAI from "openai";

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";
const DEFAULT_GROQ_BASE_URL = "https://api.groq.com/openai/v1";

export type LlmProvider = "gemini" | "groq";

export type GenerateTextOptions = {
  prompt: string;
  systemInstruction?: string;
  maxTokens?: number;
  temperature?: number;
  /** Override automatic provider resolution. */
  provider?: LlmProvider;
  /** Override the model. Defaults: gemini-2.5-flash | llama-3.3-70b-versatile */
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

function isFallbackEligibleError(error: unknown): boolean {
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
  model: string,
): Promise<string> {
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

  const completion = await client.chat.completions.create({
    model,
    max_tokens: options.maxTokens ?? 1024,
    ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
    ...(options.responseSchema
      ? { response_format: { type: "json_object" } }
      : {}),
    messages,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Groq response did not contain text content.");
  }
  return content;
}

/**
 * Single entry point for plain text generation across providers.
 * Returns the generated text alongside which provider/model handled it.
 */
export async function generateText(
  options: GenerateTextOptions,
): Promise<GenerateTextResult> {
  const provider = resolveLlmProvider(options.provider);
  const providerPlan = getProviderPlan(provider, !options.provider && !options.model);
  const errors: string[] = [];

  for (const targetProvider of providerPlan) {
    const model =
      options.model ??
      (targetProvider === "gemini"
        ? DEFAULT_GEMINI_MODEL
        : DEFAULT_GROQ_MODEL);

    try {
      const text =
        targetProvider === "gemini"
          ? await generateWithGemini(options, model)
          : await generateWithGroq(options, model);

      return { text, provider: targetProvider, model };
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
