import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { wrapProvider } from "./resilience";
import { ScriptedLLM } from "./llm-scripted";

export type Usage = { inputTokens: number; outputTokens: number; costUsd: number; model?: string };

/**
 * Which model does which job.
 *  main   = the core workflow (ideas, scripts, titles/description)        -> Opus 5.5, low effort
 *  visual = visual direction + thumbnail concepts, only where it matters  -> Fable 5.2, low effort
 *  light  = small mechanical checks (promise judge, tagging, summaries)   -> Sonnet 5.5
 */
export type LLMRole = "main" | "visual" | "light";
export const ROLE_DEFAULTS: Record<LLMRole, { model: string; effort: "low" | "medium" | "high" | null; inRate: number; outRate: number }> = {
  main: { model: "claude-opus-5-5", effort: "low", inRate: 5, outRate: 25 },
  visual: { model: "claude-fable-5-2", effort: "low", inRate: 5, outRate: 25 },
  light: { model: "claude-sonnet-5-5", effort: null, inRate: 3, outRate: 15 },
};
/** Env overrides: MODEL_MAIN / MODEL_VISUAL / MODEL_LIGHT, EFFORT_<ROLE>, and <ROLE>_INPUT_USD_PER_MTOK / <ROLE>_OUTPUT_USD_PER_MTOK. Rates are estimates. */
export function roleConfig(role: LLMRole = "main") {
  const d = ROLE_DEFAULTS[role], R = role.toUpperCase();
  const effort = (process.env[`EFFORT_${R}`] ?? d.effort ?? "") as string;
  return {
    model: process.env[`MODEL_${R}`] ?? (role === "light" ? process.env.ANTHROPIC_MODEL : undefined) ?? d.model,
    effort: (["low", "medium", "high"].includes(effort) ? effort : null) as "low" | "medium" | "high" | null,
    inRate: Number(process.env[`${R}_INPUT_USD_PER_MTOK`] ?? d.inRate),
    outRate: Number(process.env[`${R}_OUTPUT_USD_PER_MTOK`] ?? d.outRate),
  };
}

export interface LLM {
  /** Ask for JSON matching `schema`. Retries once with the validation error if the first reply is invalid. */
  json<T>(o: { system: string; user: string; schema: z.ZodType<T>; maxTokens?: number; role?: LLMRole }): Promise<{ data: T; usage: Usage }>;
}

export const estimateCost = (i: number, o: number, role: LLMRole = "main") => {
  const c = roleConfig(role);
  return (i * c.inRate + o * c.outRate) / 1e6;
};

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
  async json<T>(o: { system: string; user: string; schema: z.ZodType<T>; maxTokens?: number; role?: LLMRole }) {
    const role = o.role ?? "main";
    const { model, effort } = roleConfig(role);
    let user = o.user, inTok = 0, outTok = 0, lastErr = "";
    for (let attempt = 0; attempt < 2; attempt++) {
      const msg = await this.client.messages.create({
        model, max_tokens: o.maxTokens ?? 4096, system: o.system + "\n\nRespond with a single JSON value only, no prose.",
        messages: [{ role: "user", content: user }],
        ...(effort ? { output_config: { effort } } : {}),
      } as Anthropic.MessageCreateParamsNonStreaming);
      inTok += msg.usage.input_tokens; outTok += msg.usage.output_tokens;
      const text = msg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
      try {
        const data = o.schema.parse(extractJson(text));
        return { data, usage: { inputTokens: inTok, outputTokens: outTok, costUsd: estimateCost(inTok, outTok, role), model } };
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
  calls: { system: string; user: string; role?: LLMRole }[] = [];
  constructor(private respond: (system: string, user: string) => unknown) {}
  async json<T>(o: { system: string; user: string; schema: z.ZodType<T>; role?: LLMRole }) {
    this.calls.push({ system: o.system, user: o.user, role: o.role });
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
