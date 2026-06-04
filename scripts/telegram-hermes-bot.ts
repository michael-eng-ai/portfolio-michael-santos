import { getBotState, setBotState } from "@/lib/bot-state";
import { generateText, resolveLlmProvider } from "@/lib/llm-text";
import { fetchWithTimeout, sleep, toErrorMessage } from "@/lib/runtime";

const BOT_STATE_KEY = "telegram.hermes.offset";
const DEFAULT_POLL_TIMEOUT_SECONDS = 30;
const DEFAULT_ERROR_DELAY_MS = 5_000;
const DEFAULT_CONFLICT_DELAY_MS = 120_000;
const TELEGRAM_MAX_MESSAGE_LENGTH = 3900;

type TelegramChat = {
  id: number;
  type: string;
};

type TelegramMessage = {
  message_id: number;
  text?: string;
  date: number;
  chat: TelegramChat;
  from?: {
    id: number;
    is_bot?: boolean;
    first_name?: string;
    username?: string;
  };
};

type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
};

type TelegramResponse<T> = {
  ok: boolean;
  result?: T;
  description?: string;
};

type OffsetState = {
  nextOffset: number;
  updatedAt: string;
};

const token = process.env.TELEGRAM_BOT_TOKEN_HERMES;
const homeChatId = process.env.TELEGRAM_HOME_CHAT_ID;
let running = true;

function requireTelegramEnv(): void {
  if (!token || !homeChatId) {
    throw new Error("TELEGRAM_BOT_TOKEN_HERMES and TELEGRAM_HOME_CHAT_ID must be set.");
  }
}

function telegramUrl(method: string): string {
  return `https://api.telegram.org/bot${token}/${method}`;
}

function pollTimeoutSeconds(): number {
  const raw = Number(process.env.TELEGRAM_POLL_TIMEOUT_SECONDS ?? DEFAULT_POLL_TIMEOUT_SECONDS);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : DEFAULT_POLL_TIMEOUT_SECONDS;
}

function conflictDelayMs(): number {
  const raw = Number(process.env.TELEGRAM_CONFLICT_DELAY_SECONDS);
  return Number.isFinite(raw) && raw >= 30 ? Math.floor(raw * 1000) : DEFAULT_CONFLICT_DELAY_MS;
}

function isTelegramPollingConflict(error: unknown): boolean {
  const message = toErrorMessage(error);
  return message.includes("409 Conflict") || message.includes("terminated by other getUpdates request");
}

function isAllowedChat(chatId: number): boolean {
  return String(chatId) === String(homeChatId);
}

async function telegramApi<T>(method: string, payload: Record<string, unknown>): Promise<T> {
  const response = await fetchWithTimeout(telegramUrl(method), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    timeoutMs: (pollTimeoutSeconds() + 10) * 1000,
  });
  const body = await response.json() as TelegramResponse<T>;

  if (!response.ok || !body.ok) {
    throw new Error(`Telegram ${method} failed: ${response.status} ${body.description ?? ""}`.trim());
  }

  return body.result as T;
}

function splitTelegramMessage(text: string): string[] {
  const trimmed = text.trim();

  if (trimmed.length <= TELEGRAM_MAX_MESSAGE_LENGTH) {
    return [trimmed || "Sem resposta gerada."];
  }

  const parts: string[] = [];
  let remaining = trimmed;

  while (remaining.length > TELEGRAM_MAX_MESSAGE_LENGTH) {
    const slice = remaining.slice(0, TELEGRAM_MAX_MESSAGE_LENGTH);
    const breakAt = Math.max(slice.lastIndexOf("\n"), slice.lastIndexOf(". "), slice.lastIndexOf(" "));
    const index = breakAt > 500 ? breakAt + 1 : TELEGRAM_MAX_MESSAGE_LENGTH;
    parts.push(remaining.slice(0, index).trim());
    remaining = remaining.slice(index).trim();
  }

  if (remaining) {
    parts.push(remaining);
  }

  return parts;
}

async function sendMessage(chatId: number, text: string, replyToMessageId?: number): Promise<void> {
  for (const part of splitTelegramMessage(text)) {
    await telegramApi("sendMessage", {
      chat_id: chatId,
      text: part,
      reply_to_message_id: replyToMessageId,
      disable_web_page_preview: true,
    });
  }
}

async function sendTyping(chatId: number): Promise<void> {
  await telegramApi("sendChatAction", {
    chat_id: chatId,
    action: "typing",
  });
}

async function readOffset(): Promise<number | undefined> {
  const state = await getBotState<OffsetState>(BOT_STATE_KEY);
  return state?.nextOffset;
}

async function saveOffset(nextOffset: number): Promise<void> {
  await setBotState(BOT_STATE_KEY, {
    nextOffset,
    updatedAt: new Date().toISOString(),
  } satisfies OffsetState);
}

async function bootstrapOffset(): Promise<number | undefined> {
  const current = await readOffset();

  if (current !== undefined) {
    return current;
  }

  const updates = await telegramApi<TelegramUpdate[]>("getUpdates", {
    offset: -1,
    limit: 1,
    timeout: 0,
  });

  const latest = updates.at(-1);
  if (!latest) {
    return undefined;
  }

  const nextOffset = latest.update_id + 1;
  await saveOffset(nextOffset);
  console.log(`[hermes] initialized Telegram offset at ${nextOffset}; old pending updates ignored`);
  return nextOffset;
}

function buildSystemInstruction(): string {
  return [
    "Voce e Hermes, um assistente pessoal no Telegram para Michael Santos.",
    "Responda em portugues do Brasil por padrao, de forma objetiva, util e calma.",
    "Voce nao possui memoria persistente de conversa. Use apenas a mensagem atual.",
    "Nao afirme que executou acoes externas, leu arquivos ou acessou sistemas quando isso nao estiver na mensagem.",
    "Quando faltar contexto, diga o que falta e proponha o proximo passo mais simples.",
  ].join(" ");
}

async function answerWithLlm(message: TelegramMessage): Promise<string> {
  const userName = message.from?.username ?? message.from?.first_name ?? "usuario";
  const prompt = [
    `Mensagem de @${userName} no Telegram:`,
    "",
    message.text ?? "",
  ].join("\n");
  const result = await generateText({
    systemInstruction: buildSystemInstruction(),
    prompt,
    maxTokens: 900,
    temperature: 0.4,
  });

  return `${result.text.trim()}\n\n_${result.provider}/${result.model}_`;
}

function statusMessage(): string {
  const provider = resolveLlmProvider();
  return [
    "Hermes esta online.",
    `LLM ativo: ${provider}`,
    "Memoria de conversa: zerada/desativada",
    "Comandos: /start, /status, /reset",
  ].join("\n");
}

async function handleMessage(message: TelegramMessage): Promise<void> {
  if (!message.text || message.from?.is_bot) {
    return;
  }

  if (!isAllowedChat(message.chat.id)) {
    console.warn(`[hermes] ignored message from unauthorized chat ${message.chat.id}`);
    return;
  }

  const text = message.text.trim();

  if (text === "/start") {
    await sendMessage(
      message.chat.id,
      "Hermes reiniciado e pronto. Estou sem memoria de conversa antiga; pode me mandar uma tarefa ou pergunta.",
      message.message_id,
    );
    return;
  }

  if (text === "/status") {
    await sendMessage(message.chat.id, statusMessage(), message.message_id);
    return;
  }

  if (text === "/reset") {
    await sendMessage(
      message.chat.id,
      "Memoria limpa. Nesta versao eu nao mantenho historico de conversa entre mensagens.",
      message.message_id,
    );
    return;
  }

  await sendTyping(message.chat.id);
  const answer = await answerWithLlm(message);
  await sendMessage(message.chat.id, answer, message.message_id);
}

async function pollOnce(offset: number | undefined): Promise<number | undefined> {
  const updates = await telegramApi<TelegramUpdate[]>("getUpdates", {
    ...(offset !== undefined ? { offset } : {}),
    limit: 20,
    timeout: pollTimeoutSeconds(),
    allowed_updates: ["message"],
  });

  let nextOffset = offset;

  for (const update of updates) {
    nextOffset = update.update_id + 1;
    await saveOffset(nextOffset);

    if (update.message) {
      try {
        await handleMessage(update.message);
      } catch (error) {
        console.warn(`[hermes] failed to handle update ${update.update_id}: ${toErrorMessage(error)}`);
        if (isAllowedChat(update.message.chat.id)) {
          await sendMessage(
            update.message.chat.id,
            `Erro ao responder: ${toErrorMessage(error)}`,
            update.message.message_id,
          );
        }
      }
    }
  }

  return nextOffset;
}

async function main(): Promise<void> {
  requireTelegramEnv();
  const me = await telegramApi<{ id: number; username?: string; first_name?: string }>("getMe", {});
  console.log(`[hermes] Telegram bot authenticated as ${me.username ?? me.first_name ?? me.id}`);
  console.log(`[hermes] LLM provider resolved as ${resolveLlmProvider()}`);

  let offset = await bootstrapOffset();

  while (running) {
    try {
      offset = await pollOnce(offset);
    } catch (error) {
      if (isTelegramPollingConflict(error)) {
        const delayMs = conflictDelayMs();
        console.warn(
          `[hermes] polling conflict: another Telegram getUpdates consumer is using this token; retrying in ${Math.round(delayMs / 1000)}s`,
        );
        await sleep(delayMs);
        continue;
      }

      console.warn(`[hermes] polling error: ${toErrorMessage(error)}`);
      await sleep(DEFAULT_ERROR_DELAY_MS);
    }
  }

  console.log("[hermes] stopped");
}

process.on("SIGTERM", () => {
  running = false;
});

process.on("SIGINT", () => {
  running = false;
});

main().catch((error) => {
  console.error("[hermes] fatal error", error);
  process.exit(1);
});
