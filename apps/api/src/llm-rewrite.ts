import Anthropic from "@anthropic-ai/sdk";

// Per-trade conversational rewriter.
// Takes the deterministic next-question text from the question selector and
// asks Claude Haiku to rephrase it given the recent conversation, so replies
// feel human while the data path stays deterministic.
//
// Falls back to the deterministic text on any error, timeout, or if
// ANTHROPIC_API_KEY is unset — chat keeps working without the LLM.
//
// Caching note: prompt caching minimum prefix on Haiku 4.5 is 4096 tokens.
// Our system prompt is well below that, so cache_control is omitted (it would
// silently no-op). Cost is ~$0.001 per turn at this size.

const MODEL = "claude-haiku-4-5";
const TIMEOUT_MS = 8000;
const MAX_TOKENS = 220;
const MAX_TRANSCRIPT_TURNS = 6;

const SYSTEM_PROMPT = `You rewrite messages for TradeMate, a UK platform that qualifies tradesman job enquiries via chat.

Your job: take a deterministic BASE REPLY (which contains the next question to ask) and the recent conversation, and return a rewritten version that sounds natural and conversational.

RULES:
- The rewritten message MUST ask for the same information as the BASE REPLY. Do not change the meaning. Do not invent new questions, conditions, or commitments.
- Briefly acknowledge what the customer just said before asking, when it makes sense. Don't force it.
- Keep it tight — usually one short sentence, two at most.
- Use British English: "tradesman", "postcode", "£" (never "$"), "kitchen fitter" not "kitchen contractor".
- Plain, friendly language. No marketing speak. No emojis. No exclamation marks unless the customer used one.
- Don't repeat the customer's full message back verbatim.
- If the customer expressed uncertainty ("not sure", "no idea"), acknowledge it warmly.
- If the BASE REPLY contains a list of options (e.g. "a rewire, extra sockets, an EV charger..."), preserve them all.
- Return ONLY the rewritten message text. No quotes around it. No prefixes like "Bot:".`;

export type TranscriptEntry = {
  role: string;
  text: string;
};

export type RewriteArgs = {
  baseReply: string;
  fieldKey?: string | null;
  tradeKind?: string | null;
  tradeLabel?: string | null;
  recentTranscript?: TranscriptEntry[];
  isFirstQuestion?: boolean;
};

let cachedClient: Anthropic | null = null;

function getClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return null;
  if (cachedClient) return cachedClient;
  cachedClient = new Anthropic({ apiKey, timeout: TIMEOUT_MS });
  return cachedClient;
}

function buildUserMessage(args: RewriteArgs): string {
  const lines: string[] = [];
  if (args.tradeLabel) lines.push(`TRADE: ${args.tradeLabel}`);
  if (args.fieldKey) lines.push(`ASKING ABOUT: ${args.fieldKey}`);
  if (args.isFirstQuestion) {
    lines.push("THIS IS THE FIRST MESSAGE OF THE CONVERSATION (no prior context).");
  }
  lines.push(`BASE REPLY: ${args.baseReply}`);

  const transcript = (args.recentTranscript || []).slice(-MAX_TRANSCRIPT_TURNS);
  if (transcript.length > 0) {
    lines.push("");
    lines.push("RECENT CONVERSATION:");
    for (const m of transcript) {
      const role =
        m.role === "user" ? "Customer" : m.role === "bot" ? "Bot" : "System";
      const text = String(m.text || "").trim();
      if (text) lines.push(`${role}: ${text}`);
    }
  }

  lines.push("");
  lines.push(
    "Rewrite the BASE REPLY conversationally. Return only the rewritten message."
  );
  return lines.join("\n");
}

function logRewriteEvent(
  level: "info" | "error",
  event: string,
  data: Record<string, unknown> = {}
) {
  const line = JSON.stringify({
    level,
    event,
    at: new Date().toISOString(),
    ...data,
  });
  if (level === "error") console.error(line);
  else console.log(line);
}

export async function rewriteReply(args: RewriteArgs): Promise<string> {
  const fallback = String(args.baseReply || "").trim();

  const client = getClient();
  if (!client) return fallback;
  if (!fallback) return fallback;

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserMessage(args) }],
    });

    let text = "";
    for (const block of response.content) {
      if (block.type === "text") text += block.text;
    }

    let cleaned = text.trim();
    cleaned = cleaned.replace(/^["“'']+|["”'']+$/g, "").trim();
    if (!cleaned) return fallback;

    // Length sanity guard. If the rewrite is wildly longer than the base, the
    // model probably went off-script — fall back rather than ship it.
    const baseLen = fallback.length;
    if (cleaned.length > baseLen * 4 + 200) {
      logRewriteEvent("error", "llm_rewrite.length_anomaly", {
        baseLen,
        rewriteLen: cleaned.length,
        fieldKey: args.fieldKey || null,
      });
      return fallback;
    }

    logRewriteEvent("info", "llm_rewrite.success", {
      fieldKey: args.fieldKey || null,
      tradeKind: args.tradeKind || null,
      inputTokens: response.usage?.input_tokens ?? null,
      outputTokens: response.usage?.output_tokens ?? null,
    });

    return cleaned;
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      logRewriteEvent("error", "llm_rewrite.api_error", {
        status: err.status ?? null,
        message: err.message,
        fieldKey: args.fieldKey || null,
      });
    } else {
      logRewriteEvent("error", "llm_rewrite.unknown_error", {
        message: err instanceof Error ? err.message : String(err),
        fieldKey: args.fieldKey || null,
      });
    }
    return fallback;
  }
}
