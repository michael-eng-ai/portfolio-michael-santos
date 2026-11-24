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
  DEFAULT_GROQ_MODEL,
  GROQ_FALLBACK_MODELS,
  generateText,
  groqCompletionOptions,
  groqModelsToTry,
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
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults to the current production Groq models", () => {
    expect(DEFAULT_GROQ_MODEL).toBe("openai/gpt-oss-120b");
    expect(groqModelsToTry()).toEqual([DEFAULT_GROQ_MODEL, ...GROQ_FALLBACK_MODELS]);
    expect(groqModelsToTry()).not.toContain("llama-3.3-70b-versatile");
  });

  it("tries GROQ_MODEL first, then the default and the production fallback", () => {
    vi.stubEnv("GROQ_MODEL", "llama-3.3-70b-versatile");
    expect(groqModelsToTry()).toEqual([
      "llama-3.3-70b-versatile",
      "openai/gpt-oss-120b",
      "openai/gpt-oss-20b",
    ]);
  });

  it("does not repeat the default when GROQ_MODEL already selects it", () => {
    vi.stubEnv("GROQ_MODEL", DEFAULT_GROQ_MODEL);
    expect(groqModelsToTry()).toEqual(["openai/gpt-oss-120b", "openai/gpt-oss-20b"]);
  });

  it("uses an explicit model alone", () => {
    vi.stubEnv("GROQ_MODEL", "llama-3.3-70b-versatile");
    expect(groqModelsToTry("custom-model")).toEqual(["custom-model"]);
  });

  it("gives GPT-OSS reasoning headroom and leaves other models on max_tokens", () => {
    expect(groqCompletionOptions("openai/gpt-oss-120b", 2048)).toEqual({
      max_completion_tokens: 3072,
      reasoning_effort: "low",
    });
    expect(groqCompletionOptions("llama-3.3-70b-versatile", 512)).toEqual({
      max_tokens: 512,
    });
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

  it("recovers from a stale GROQ_MODEL without leaving Groq", async () => {
    vi.stubEnv("GROQ_MODEL", "llama-3.3-70b-versatile");
    createMock.mockImplementation(async (params: { model: string }) => {
      if (params.model === "llama-3.3-70b-versatile") throw notFound(params.model);
      return groqResponse("recovered");
    });

    const result = await generateText({ prompt: "write" });

    expect(result.model).toBe("openai/gpt-oss-120b");
    expect(result.text).toBe("recovered");
    expect(generateContentMock).not.toHaveBeenCalled();
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
