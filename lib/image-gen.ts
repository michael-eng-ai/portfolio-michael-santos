import { promises as fs } from "node:fs";
import path from "node:path";

const DEFAULT_GEMINI_IMAGE_MODEL = "nano-banana-pro-preview";
const FALLBACK_GEMINI_IMAGE_MODEL = "gemini-3-pro-image-preview";
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

export type GenerateCoverImageInput = {
  /** Article slug — used as the output filename. */
  slug: string;
  /** Concise prompt describing the cover (what the article is about). */
  prompt: string;
  /** Output directory (absolute or relative to cwd). Default: public/images/articles */
  outputDir?: string;
  /** Override the Gemini model. Defaults to nano-banana-pro-preview. */
  model?: string;
  /** Public URL prefix used to compute the returned URL. Default: /images/articles */
  publicPrefix?: string;
};

export type GenerateCoverImageResult = {
  /** Absolute filesystem path of the saved image. */
  filePath: string;
  /** Public URL the article should reference (e.g. /images/articles/foo.png). */
  publicUrl: string;
  /** Model that produced the image. */
  model: string;
  /** Bytes written. */
  bytes: number;
};

const ART_DIRECTION = `Editorial cover illustration for a senior data engineering blog. Style:
clean modern 3D render OR flat geometric illustration, blue and dark navy
palette with subtle teal highlights, abstract data-flow / circuit / pipeline
geometry, no text, no logos, no human figures unless essential. Banner
aspect ratio 16:9, suitable as a hero image and Open Graph card.
Prefer a photoreal-abstract or crisp illustration that reads clearly at
1200x630 social crop. Output a single JPEG-friendly image when possible.`;

function buildPrompt(prompt: string): string {
  return `${ART_DIRECTION}\n\nSubject: ${prompt}`;
}

function extensionForMime(mimeType: string): "jpg" | "png" {
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
    return "jpg";
  }
  // Gemini preview models often return PNG; keep PNG rather than lying about JPG.
  return "png";
}

function isRetryableImageError(error: Error): boolean {
  const message = error.message.toLowerCase();
  return (
    message.includes("429") ||
    message.includes("503") ||
    message.includes("unavailable") ||
    message.includes("high demand") ||
    message.includes("rate") ||
    message.includes("quota") ||
    message.includes("timeout")
  );
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGeminiImage(
  apiKey: string,
  model: string,
  prompt: string,
): Promise<{ data: string; mimeType: string }> {
  const url = `${GEMINI_BASE_URL}/${model}:generateContent`;
  const maxAttempts = 3;
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildPrompt(prompt) }] }],
          generationConfig: { responseModalities: ["IMAGE"] },
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(
          `Gemini image API ${model} returned HTTP ${response.status}: ${body.slice(0, 300)}`,
        );
      }

      const payload = (await response.json()) as {
        candidates?: { content?: { parts?: { inlineData?: { data: string; mimeType: string } }[] } }[];
        error?: { message?: string };
      };

      const parts = payload.candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          return { data: part.inlineData.data, mimeType: part.inlineData.mimeType ?? "image/png" };
        }
      }

      const errorMessage = payload.error?.message ?? "no inlineData in response";
      throw new Error(`Gemini image API ${model} returned no image: ${errorMessage}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxAttempts && isRetryableImageError(lastError)) {
        const delayMs = attempt * 8_000;
        console.warn(
          `Gemini image ${model} attempt ${attempt} failed (${lastError.message.slice(0, 120)}); retrying in ${delayMs}ms`,
        );
        await sleep(delayMs);
        continue;
      }
      throw lastError;
    }
  }

  throw lastError ?? new Error(`Gemini image API ${model} failed`);
}

async function persistCoverBuffer(input: {
  slug: string;
  outputDir: string;
  publicPrefix: string;
  buffer: Buffer;
  ext: "jpg" | "png";
  model: string;
}): Promise<GenerateCoverImageResult> {
  const fileName = `${input.slug}.${input.ext}`;
  const filePath = path.join(input.outputDir, fileName);

  await fs.mkdir(input.outputDir, { recursive: true });
  await Promise.all(
    (["jpg", "jpeg", "png", "webp"] as const)
      .filter((candidate) => candidate !== input.ext && candidate !== (input.ext === "jpg" ? "jpeg" : input.ext))
      .map(async (candidate) => {
        try {
          await fs.unlink(path.join(input.outputDir, `${input.slug}.${candidate}`));
        } catch {
          // Ignore missing stale files.
        }
      }),
  );
  await fs.writeFile(filePath, input.buffer);

  return {
    filePath,
    publicUrl: `${input.publicPrefix}/${fileName}`,
    model: input.model,
    bytes: input.buffer.byteLength,
  };
}

/**
 * Generates a cover image for an article via Gemini and saves it to disk.
 * Tries the preferred model first, then falls back to FALLBACK_GEMINI_IMAGE_MODEL
 * on transient errors (typically 503 on the preview models).
 */
export async function generateCoverImage(
  input: GenerateCoverImageInput,
): Promise<GenerateCoverImageResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set; cannot generate cover image.");
  }

  const outputDir = input.outputDir
    ? path.resolve(input.outputDir)
    : path.join(process.cwd(), "public", "images", "articles");
  const publicPrefix = input.publicPrefix ?? "/images/articles";
  const primaryModel = input.model ?? DEFAULT_GEMINI_IMAGE_MODEL;

  const modelsToTry = primaryModel === FALLBACK_GEMINI_IMAGE_MODEL
    ? [primaryModel]
    : [primaryModel, FALLBACK_GEMINI_IMAGE_MODEL];

  let lastError: Error | undefined;
  for (const model of modelsToTry) {
    try {
      const { data, mimeType } = await callGeminiImage(apiKey, model, input.prompt);
      const ext = extensionForMime(mimeType);
      return persistCoverBuffer({
        slug: input.slug,
        outputDir,
        publicPrefix,
        buffer: Buffer.from(data, "base64"),
        ext,
        model,
      });
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(
        `Cover image generation with ${model} failed (${lastError.message}); trying next model.`,
      );
    }
  }

  throw new Error(
    `All cover image models failed. Last error: ${lastError?.message ?? "unknown"}`,
  );
}
