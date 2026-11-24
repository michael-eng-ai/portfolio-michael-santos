import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createMock = vi.hoisted(() => vi.fn());
const generateContentMock = vi.hoisted(() => vi.fn());

vi.mock("openai", () => {
  class OpenAI {
    chat = { completions: { create: createMock } };
  }
  return { default: OpenAI };
});

vi.mock("@google/genai", () => {
  class GoogleGenAI {
    models = { generateContent: generateContentMock };
  }
  return { GoogleGenAI };
});

import {
  DEFAULT_GROQ_FALLBACK_MODEL,
  DEFAULT_GROQ_MODEL,
  generateText,
  groqCompletionOptions,
  groqFinalContent,
  groqModelsToTry,
  isGroqLlamaModel,
} from "@/lib/llm-text";

function notFound(model: string): Error {
  const error = new Error(
    `404 The model \`${model}\` does not exist or you do not have access to it.`,
  );
  error.name = "NotFoundError";
  Object.assign(error, { status: 404, code: "model_not_found" });
  return error;
}

function groqResponse(text: string) {
  return { choices: [{ message: { content: text } }] };
}

describe("Groq model selection", () => {
  beforeEach(() => {
    createMock.mockReset();
    generateContentMock.mockReset();
    vi.stubEnv("GROQ_API_KEY", "test-groq");
    vi.stubEnv("GEMINI_API_KEY", "test-gemini");
    vi.stubEnv("LLM_PROVIDER", "groq");
    vi.stubEnv("GROQ_MODEL", "");
    vi.stubEnv("GROQ_FALLBACK_MODEL", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults to the approved GPT-OSS models", () => {
    expect(DEFAULT_GROQ_MODEL).toBe("openai/gpt-oss-120b");
    expect(DEFAULT_GROQ_FALLBACK_MODEL).toBe("openai/gpt-oss-20b");
    expect(groqModelsToTry()).toEqual([DEFAULT_GROQ_MODEL, DEFAULT_GROQ_FALLBACK_MODEL]);
    expect(groqModelsToTry().some((model) => isGroqLlamaModel(model))).toBe(false);
  });

  it("reads GROQ_MODEL and GROQ_FALLBACK_MODEL", () => {
    vi.stubEnv("GROQ_MODEL", "openai/gpt-oss-20b");
    vi.stubEnv("GROQ_FALLBACK_MODEL", "custom-fallback");
    expect(groqModelsToTry()).toEqual(["openai/gpt-oss-20b", "custom-fallback"]);
  });

  it("does not fall back to a llama model from either env var", () => {
    vi.stubEnv("GROQ_MODEL", "llama-3.3-70b-versatile");
    vi.stubEnv("GROQ_FALLBACK_MODEL", "llama-3.1-8b-instant");
    expect(groqModelsToTry()).toEqual(["openai/gpt-oss-120b", "openai/gpt-oss-20b"]);
    expect(groqModelsToTry("meta-llama/llama-4-scout-17b-16e-instruct")).toEqual([
      "openai/gpt-oss-120b",
      "openai/gpt-oss-20b",
    ]);
  });

  it("does not repeat the primary when GROQ_FALLBACK_MODEL matches it", () => {
    vi.stubEnv("GROQ_MODEL", DEFAULT_GROQ_MODEL);
    vi.stubEnv("GROQ_FALLBACK_MODEL", DEFAULT_GROQ_MODEL);
    expect(groqModelsToTry()).toEqual(["openai/gpt-oss-120b"]);
  });

  it("uses an explicit model alone", () => {
    vi.stubEnv("GROQ_MODEL", "llama-3.3-70b-versatile");
    expect(groqModelsToTry("custom-model")).toEqual(["custom-model"]);
  });

  it("reserves completion tokens for GPT-OSS reasoning and asks for the final answer only", () => {
    expect(groqCompletionOptions("openai/gpt-oss-120b", 2048)).toEqual({
      max_completion_tokens: 3072,
      reasoning_effort: "low",
      include_reasoning: false,
    });
    expect(groqCompletionOptions("custom-model", 512)).toEqual({
      max_tokens: 512,
    });
  });

  it("reads message.content and drops an inlined reasoning trace", () => {
    expect(
      groqFinalContent({
        content: "<think>plan the briefing</think>\n{\"ok\":true}",
        reasoning: "do not return this",
      } as { content: string }),
    ).toBe('{"ok":true}');
    expect(groqFinalContent({ content: null, reasoning: "only reasoning" } as { content: null })).toBe("");
  });

  it("calls openai/gpt-oss-120b for the daily briefing provider", async () => {
    createMock.mockResolvedValue(groqResponse('{"ok":true}'));

    const result = await generateText({
      prompt: "write the briefing",
      maxTokens: 4096,
      responseSchema: {} as never,
    });

    expect(result).toEqual({
      text: '{"ok":true}',
      provider: "groq",
      model: "openai/gpt-oss-120b",
    });
    expect(createMock).toHaveBeenCalledTimes(1);
    expect(createMock.mock.calls[0][0]).toMatchObject({
      model: "openai/gpt-oss-120b",
      max_completion_tokens: 5120,
      reasoning_effort: "low",
      include_reasoning: false,
      response_format: { type: "json_object" },
    });
    expect(generateContentMock).not.toHaveBeenCalled();
  });

  it("falls back to the next Groq model when the first returns 404", async () => {
    createMock.mockImplementation(async (params: { model: string }) => {
      if (params.model === DEFAULT_GROQ_MODEL) throw notFound(params.model);
      return groqResponse("from-20b");
    });

    const result = await generateText({ prompt: "write" });

    expect(result).toEqual({
      text: "from-20b",
      provider: "groq",
      model: "openai/gpt-oss-20b",
    });
    expect(createMock).toHaveBeenCalledTimes(2);
    expect(generateContentMock).not.toHaveBeenCalled();
  });

  it("falls back to Gemini when every Groq model returns 404", async () => {
    createMock.mockImplementation(async (params: { model: string }) => {
      throw notFound(params.model);
    });
    generateContentMock.mockResolvedValue({ text: "from-gemini" });

    const result = await generateText({ prompt: "write" });

    expect(result).toEqual({
      text: "from-gemini",
      provider: "gemini",
      model: "gemini-2.5-flash",
    });
    expect(createMock).toHaveBeenCalledTimes(2);
    expect(generateContentMock).toHaveBeenCalledTimes(1);
  });

  it("does not call a llama model when GROQ_MODEL still names one", async () => {
    vi.stubEnv("GROQ_MODEL", "llama-3.3-70b-versatile");
    vi.stubEnv("GROQ_FALLBACK_MODEL", "llama-3.1-8b-instant");
    createMock.mockResolvedValue({
      choices: [{
        message: {
          content: "<think>ignored</think>from-120b",
          reasoning: "ignored reasoning",
        },
      }],
    });

    const result = await generateText({ prompt: "write" });

    expect(result).toEqual({
      text: "from-120b",
      provider: "groq",
      model: "openai/gpt-oss-120b",
    });
    const models = createMock.mock.calls.map((call) => call[0].model as string);
    expect(models).toEqual(["openai/gpt-oss-120b"]);
    expect(models.some((model) => isGroqLlamaModel(model))).toBe(false);
    expect(generateContentMock).not.toHaveBeenCalled();
  });

  it("uses GROQ_FALLBACK_MODEL when the primary model returns 404", async () => {
    vi.stubEnv("GROQ_FALLBACK_MODEL", "custom-fallback");
    createMock.mockImplementation(async (params: { model: string }) => {
      if (params.model === DEFAULT_GROQ_MODEL) throw notFound(params.model);
      return groqResponse("from-custom");
    });

    const result = await generateText({ prompt: "write" });

    expect(result).toEqual({
      text: "from-custom",
      provider: "groq",
      model: "custom-fallback",
    });
  });

  it("treats a 404 message without a status code as model-not-found", async () => {
    createMock.mockImplementation(async (params: { model: string }) => {
      if (params.model === DEFAULT_GROQ_MODEL) {
        throw new Error("404 The model does not exist or you do not have access to it.");
      }
      return groqResponse("recovered");
    });

    const result = await generateText({ prompt: "write" });
    expect(result.model).toBe("openai/gpt-oss-20b");
  });

  it("does not try another Groq model on rate limits, and does try Gemini", async () => {
    createMock.mockRejectedValue(new Error("429 rate limit exceeded"));
    generateContentMock.mockResolvedValue({ text: "gemini-ok" });

    const result = await generateText({ prompt: "write" });

    expect(result.provider).toBe("gemini");
    expect(createMock).toHaveBeenCalledTimes(1);
  });

  it("does not fall back on a non-retryable Groq error", async () => {
    createMock.mockRejectedValue(new Error("400 invalid prompt"));

    await expect(generateText({ prompt: "write" })).rejects.toThrow("400 invalid prompt");
    expect(createMock).toHaveBeenCalledTimes(1);
    expect(generateContentMock).not.toHaveBeenCalled();
  });

  it("does not switch model or provider when the caller pins both", async () => {
    createMock.mockRejectedValue(notFound("retired-model"));

    await expect(
      generateText({ prompt: "write", provider: "groq", model: "retired-model" }),
    ).rejects.toThrow(/does not exist/);
    expect(createMock).toHaveBeenCalledTimes(1);
    expect(createMock.mock.calls[0][0].model).toBe("retired-model");
    expect(generateContentMock).not.toHaveBeenCalled();
  });

  it("keeps a pinned provider on Groq when every Groq model 404s", async () => {
    createMock.mockImplementation(async (params: { model: string }) => {
      throw notFound(params.model);
    });

    await expect(generateText({ prompt: "write", provider: "groq" })).rejects.toThrow(
      /All configured LLM providers failed/,
    );
    expect(createMock).toHaveBeenCalledTimes(2);
    expect(generateContentMock).not.toHaveBeenCalled();
  });

  it("falls back from a missing Gemini model to Groq", async () => {
    vi.stubEnv("LLM_PROVIDER", "gemini");
    generateContentMock.mockRejectedValue(notFound("gemini-2.5-flash"));
    createMock.mockResolvedValue(groqResponse("groq-ok"));

    const result = await generateText({ prompt: "write" });

    expect(result).toEqual({
      text: "groq-ok",
      provider: "groq",
      model: "openai/gpt-oss-120b",
    });
  });
});
