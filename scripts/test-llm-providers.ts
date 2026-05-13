import { generateText, type LlmProvider } from "@/lib/llm-text";
import { toErrorMessage } from "@/lib/runtime";

const PROVIDERS: LlmProvider[] = ["groq", "gemini"];

async function testProvider(provider: LlmProvider) {
  const startedAt = Date.now();
  const result = await generateText({
    provider,
    prompt: "Return exactly: ok",
    maxTokens: 64,
    temperature: 0,
  });
  const elapsedMs = Date.now() - startedAt;
  const text = result.text.trim();

  if (!text.toLowerCase().includes("ok")) {
    throw new Error(`${provider} returned unexpected text: ${text.slice(0, 80)}`);
  }

  return { provider, model: result.model, elapsedMs };
}

async function main() {
  const results = [];

  for (const provider of PROVIDERS) {
    try {
      results.push({ ...(await testProvider(provider)), status: "ok" });
    } catch (error) {
      results.push({ provider, status: "failed", error: toErrorMessage(error) });
    }
  }

  console.log(JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2));

  if (results.some((result) => result.status !== "ok")) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
