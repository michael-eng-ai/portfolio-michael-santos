import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const DEFAULT_ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";

export type LlmProvider = "gemini" | "anthropic";

export type GenerateTextOptions = {
  prompt: string;
  systemInstruction?: string;
  maxTokens?: number;
  temperature?: number;
  /** Override automatic provider resolution. */
  provider?: LlmProvider;
  /** Override the model. Defaults: gemini-2.5-flash | claude-haiku-4-5-20251001 */
  model?: string;
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
 *   4. ANTHROPIC_API_KEY presence
 */
export function resolveLlmProvider(override?: LlmProvider): LlmProvider {
  if (override) return override;

  const envProvider = process.env.LLM_PROVIDER?.toLowerCase();
  if (envProvider === "gemini" || envProvider === "anthropic") {
    return envProvider;
  }

  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";

  throw new Error(
    "No LLM provider configured. Set GEMINI_API_KEY or ANTHROPIC_API_KEY (or LLM_PROVIDER=gemini|anthropic).",
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
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini response did not contain text content.");
  }
  return text;
}

async function generateWithAnthropic(
  options: GenerateTextOptions,
  model: string,
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set; cannot use the Anthropic provider.");
  }

  const anthropic = new Anthropic({ apiKey });
  const message = await anthropic.messages.create({
    model,
    max_tokens: options.maxTokens ?? 1024,
    ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
    ...(options.systemInstruction ? { system: options.systemInstruction } : {}),
    messages: [{ role: "user", content: options.prompt }],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Anthropic response did not contain text content.");
  }
  return textBlock.text;
}

/**
 * Single entry point for plain text generation across providers.
 * Returns the generated text alongside which provider/model handled it.
 */
export async function generateText(
  options: GenerateTextOptions,
): Promise<GenerateTextResult> {
  const provider = resolveLlmProvider(options.provider);
  const model =
    options.model ?? (provider === "gemini" ? DEFAULT_GEMINI_MODEL : DEFAULT_ANTHROPIC_MODEL);

  const text =
    provider === "gemini"
      ? await generateWithGemini(options, model)
      : await generateWithAnthropic(options, model);

  return { text, provider, model };
}
