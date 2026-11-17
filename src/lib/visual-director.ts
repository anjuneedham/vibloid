import { z } from "zod";
import type { LLM } from "./llm";
import { getLLM } from "./llm";
import { logCost } from "./queue";
import type { ScriptBody } from "./scripts";

const Plan = z.object({
  beats: z.array(z.object({
    i: z.number().int().min(0),
    visual_type: z.enum(["stock_video", "ai_image", "image"]),
    visual_query: z.string().min(1).max(80),
    ai_prompt: z.string().max(400).optional(),
  })).max(40),
});

const SYSTEM = `You are the visual director for a faceless money/wealth/motivation video. You do NOT change narration.
For the beats listed, choose the visual: "stock_video" (default, 2-5 concrete searchable words), or "ai_image" for at most {{MAX}} beats total where a striking metaphor stops the scroll (vivid scene in ai_prompt; no text, logos, real people, fake headlines, charts or money screenshots). Keep the hook and the single most emotional beat the most arresting. Vary the look so it changes every few seconds.
Output JSON: {"beats":[{"i":number,"visual_type":"stock_video"|"ai_image"|"image","visual_query":string,"ai_prompt":string?}]}`;

/**
 * Long-form only: one Fable (visual role) call that upgrades visual queries and picks the few beats worth an AI image.
 * Beats that already carry a chart or scene are never touched. On any failure the original script is kept.
 */
export async function directVisuals(body: ScriptBody, o: { llm?: LLM; projectId?: string; jobId?: string; datasets?: string[] } = {}): Promise<ScriptBody> {
  const max = Number(process.env.AI_MAX_PER_VIDEO ?? 2);
  const open = body.beats.map((b, i) => ({ b, i })).filter(({ b }) => !b.chart && b.visual_type !== "chart" && b.visual_type !== "scene");
  if (!open.length) return body;
  let res;
  try {
    const user = `HOOK: ${body.hook}\n` + open.map(({ b, i }) => `${i}. ${b.narration.slice(0, 280)} [current query: ${b.visual_query}]`).join("\n");
    res = await (o.llm ?? getLLM()).json({ system: SYSTEM.replace("{{MAX}}", String(max)), user, schema: Plan, maxTokens: 3000, role: "visual" });
  } catch {
    return body; // visuals are an upgrade, never a blocker
  }
  const { data, usage } = res;
  await logCost({ jobId: o.jobId, projectId: o.projectId, provider: "anthropic", unit: "tokens", quantity: usage.inputTokens + usage.outputTokens, costUsd: usage.costUsd }); // cost logging is mandatory
  {
    let ai = 0;
    const byIdx = new Map(data.beats.map((x) => [x.i, x]));
    return { ...body, beats: body.beats.map((b, i) => {
      const d = byIdx.get(i);
      if (!d || !open.some((x) => x.i === i)) return b;
      const wantAi = d.visual_type === "ai_image" && !!d.ai_prompt && ai < max;
      if (wantAi) ai++;
      return { ...b, visual_query: d.visual_query, visual_type: wantAi ? "ai_image" : d.visual_type === "ai_image" ? "stock_video" : d.visual_type, ...(wantAi ? { ai_prompt: d.ai_prompt } : {}) };
    }) };
  }
}
