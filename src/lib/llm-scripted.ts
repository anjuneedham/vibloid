import type { z } from "zod";
import type { LLM } from "./llm";

/**
 * Deterministic offline LLM used when LLM_PROVIDER=mock (e2e tests, demos without an API key).
 * It recognizes each prompt by its system text and returns a canned, schema-valid answer.
 */
export class ScriptedLLM implements LLM {
  async json<T>(o: { system: string; user: string; schema: z.ZodType<T> }) {
    return { data: o.schema.parse(this.answer(o.system, o.user)), usage: { inputTokens: 0, outputTokens: 0, costUsd: 0 } };
  }

  private answer(system: string, user: string): unknown {
    if (system.includes("select the best clips")) {
      const ends = [...user.matchAll(/\[[\d.]+-([\d.]+)\]/g)].map((m) => Number(m[1]));
      const total = ends.length ? Math.max(...ends) : 60;
      const c = (s: number, e: number, hook: string, score: number) => ({
        start_s: s, end_s: e, hook_text: hook, why_it_works: "Bold claim with a concrete takeaway.", topic_tags: ["wealth"],
        sub_scores: { hook_strength: score, standalone_clarity: 80, emotional_payload: 70, quotability: 75 }, score, risk_flags: [] as string[],
      });
      return { clips: [c(0, total * 0.5, "Income is not wealth", 88), c(total * 0.52, total, "Discipline beats motivation", 79)] };
    }
    if (system.includes("ORIGINAL scripts")) {
      const clipRef = user.match(/clip_ref ([0-9a-f-]{36})/)?.[1];
      return {
        hook: "Stop confusing income with wealth right now.",
        promise: "Here are four habits that quietly build real wealth over time.",
        beats: [
          { narration: "Habit one: pay yourself first. Inflation has averaged about three percent a year in the US [CITATION NEEDED].", visual_query: "piggy bank", on_screen_text: "PAY YOURSELF FIRST" },
          { narration: "Habit two: automate your savings so discipline never depends on motivation.", visual_query: "phone banking app", ...(clipRef ? { clip_ref: clipRef } : {}) },
          { narration: "Habit three: buy assets that produce cash flow instead of liabilities that only look rich.", visual_query: "city buildings" },
          { narration: "Habit four: stay invested through the noise, because time in the market does the heavy lifting.", visual_query: "growth chart" },
        ],
        cta: "Follow for one money idea every day.",
        claims: [{ text: "US inflation has averaged about 3% per year", needs_source: true }],
      };
    }
    if (system.includes("strict editor")) {
      const titles = [...user.matchAll(/^- (.+)$/gm)].map((m) => m[1]);
      return { results: titles.map((title) => ({ title, delivers: true, issues: [] as string[] })) };
    }
    if (system.includes("package a faceless")) {
      return {
        titles: Array.from({ length: 10 }, (_, i) => ({ title: `Money habits idea number ${i + 1}` })),
        top3: [{ title: "4 habits that quietly build wealth", reasoning: "Specific and honest." }],
        description: "Four simple habits that move you from income to real wealth.", tags: ["money", "wealth", "habits", "investing"],
        thumbnail_concepts: [
          { text: "PAY YOURSELF FIRST", subject_query: "coins", layout: "left" },
          { text: "4 WEALTH HABITS", subject_query: "desk", layout: "center" },
          { text: "STOP BEING BROKE", subject_query: "wallet", layout: "bottom" },
        ],
      };
    }
    if (system.includes("growth analyst")) {
      return {
        summary: "Early data: shorts about habits look promising.", sample_warning: null,
        do_more: [{ item: "More habit explainers", evidence: "Top video by views" }], stop_doing: [{ item: "Vague topics", evidence: "Lowest watch time" }],
        calendar: [
          { topic: "Why emergency funds matter", format: "short", style: "explained_simply", hook_idea: "One surprise bill can wipe you out.", why: "Evergreen." },
          { topic: "The latte factor myth", format: "short", style: "myth_vs_reality", hook_idea: "Coffee isn't why you're broke.", why: "Myth angle." },
        ],
      };
    }
    throw new Error("ScriptedLLM: unrecognized prompt");
  }
}
