import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { wrapProvider } from "./resilience";
import { ScriptedLLM } from "./llm-scripted";

export type Usage = { inputTokens: number; outputTokens: number; costUsd: number };

export interface LLM {
  /** Ask for JSON matching `schema`. Retries once with the validation error if the first reply is invalid. */
  json<T>(o: { system: string; user: string; schema: z.ZodType<T>; maxTokens?: number }): Promise<{ data: T; usage: Usage }>;
}

// Estimated rates in USD per million tokens; override via env if pricing changes.
const IN_RATE = Number(process.env.LLM_INPUT_USD_PER_MTOK ?? 3);
const OUT_RATE = Number(process.env.LLM_OUTPUT_USD_PER_MTOK ?? 15);
export const estimateCost = (i: number, o: number) => (i * IN_RATE + o * OUT_RATE) / 1e6;

export function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = (fenced ? fenced[1] : text).trim();
  const start = body.search(/[\[{]/);
  const end = Math.max(body.lastIndexOf("}"), body.lastIndexOf("]"));
  if (start < 0 || end < start) throw new Error("no JSON found in model output");
  return JSON.parse(body.slice(start, end + 1));
}

export class AnthropicLLM implements LLM {
  private client = new Anthropic({ maxRetries: 0 }); // retries/backoff/circuit breaker live in wrapProvider
  async json<T>(o: { system: string; user: string; schema: z.ZodType<T>; maxTokens?: number }) {
    const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5";
    let user = o.user, inTok = 0, outTok = 0, lastErr = "";
    for (let attempt = 0; attempt < 2; attempt++) {
      const msg = await this.client.messages.create({
        model, max_tokens: o.maxTokens ?? 4096, system: o.system + "\n\nRespond with a single JSON value only, no prose.",
        messages: [{ role: "user", content: user }],
      });
      inTok += msg.usage.input_tokens; outTok += msg.usage.output_tokens;
      const text = msg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
      try {
        const data = o.schema.parse(extractJson(text));
        return { data, usage: { inputTokens: inTok, outputTokens: outTok, costUsd: estimateCost(inTok, outTok) } };
      } catch (e) {
        lastErr = (e as Error).message;
        user = `${o.user}\n\nYour previous reply was invalid: ${lastErr.slice(0, 600)}\nReturn corrected JSON only.`;
      }
    }
    throw new Error("LLM returned invalid JSON twice: " + lastErr);
  }
}

/** Test double: pass a function that returns the raw object for each call. */
export class MockLLM implements LLM {
  calls: { system: string; user: string }[] = [];
  constructor(private respond: (system: string, user: string) => unknown) {}
  async json<T>(o: { system: string; user: string; schema: z.ZodType<T> }) {
    this.calls.push({ system: o.system, user: o.user });
    const data = o.schema.parse(this.respond(o.system, o.user));
    return { data, usage: { inputTokens: 0, outputTokens: 0, costUsd: 0 } };
  }
}

let llm: LLM | undefined;
export function getLLM(): LLM {
  return (llm ??= process.env.LLM_PROVIDER === "mock" ? new ScriptedLLM() : wrapProvider("anthropic", new AnthropicLLM()));
}
export function setLLM(x: LLM) {
  llm = x;
}
