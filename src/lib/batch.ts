import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { getPool } from "./db";
import { getLLM, type LLM } from "./llm";
import { enqueue, logCost } from "./queue";
import { winnersContext } from "./analytics";
import { getChannel } from "./channels";
import { assertBudget } from "./budget";

const STYLE = z.enum(["explained_simply", "myth_vs_reality", "seven_habits", "story_motivation"]);
const Idea = z.object({ topic: z.string().min(5).max(160), hook_idea: z.string().min(5).max(300), style: STYLE, hypothesis: z.string().optional(), dataset: z.string().nullable().optional() });
const Ideas = z.object({ attention: z.array(Idea).min(1).max(12), brand: z.array(Idea).min(1).max(12) });
export const STYLES = STYLE.options;

/** Make the attention-channel experiment honest: one distinct format per video (reassign duplicates). */
export function distinctStyles<T extends { style: string }>(ideas: T[]): T[] {
  const used = new Set<string>();
  const free = STYLES.filter((s) => !ideas.some((i) => i.style === s));
  return ideas.map((i) => {
    if (!used.has(i.style)) { used.add(i.style); return i; }
    const alt = free.shift() ?? i.style;
    used.add(alt);
    return { ...i, style: alt };
  });
}

export async function planBatch(o: { attentionChannelId: string; brandChannelId: string; nAttention?: number; nBrand?: number; llm?: LLM }) {
  const nA = o.nAttention ?? 4, nB = o.nBrand ?? 2;
  await assertBudget(0.1);
  const [attn, brand] = await Promise.all([getChannel(o.attentionChannelId), getChannel(o.brandChannelId)]);
  if (!attn || !brand) throw new Error("both channels must exist");
  if (attn.kind !== "attention" || brand.kind !== "brand") throw new Error("expected an attention channel and a brand channel");
  const db = getPool();
  const recent = (await db.query("select topic from projects where topic is not null order by created_at desc limit 30")).rows.map((r) => r.topic);
  const datasets = (await db.query("select name, source from datasets order by created_at desc limit 40")).rows;
  const winners = await winnersContext();
  const user = [
    `ATTENTION_COUNT: ${nA}\nBRAND_COUNT: ${nB}`,
    `ATTENTION channel: ${attn.name}. BRAND channel: ${brand.name} (own app: ${brand.voice?.app?.name ?? "Trade Notes"}${brand.voice?.app?.blurb ? ", " + brand.voice.app.blurb : ""}).`,
    `RECENT TOPICS:\n${recent.length ? recent.map((t) => "- " + t).join("\n") : "(none)"}`,
    `AVAILABLE DATASETS:\n${datasets.length ? datasets.map((d) => `- "${d.name}" (source: ${d.source})`).join("\n") : "(none)"}`,
    winners,
  ].filter(Boolean).join("\n\n");
  const { data, usage } = await (o.llm ?? getLLM()).json({ system: fs.readFileSync(path.resolve("prompts/batch-ideas.md"), "utf8"), user, schema: Ideas, maxTokens: 3000 });
  await logCost({ provider: "anthropic", unit: "tokens", quantity: usage.inputTokens + usage.outputTokens, costUsd: usage.costUsd });
  if (data.attention.length < nA || data.brand.length < nB) throw new Error(`model returned ${data.attention.length}+${data.brand.length} ideas, need ${nA}+${nB}; try again`);
  const attention = distinctStyles(data.attention.slice(0, nA)), brandIdeas = data.brand.slice(0, nB);

  const batch = (await db.query("insert into batches (plan) values ($1) returning id", [JSON.stringify({ attention, brand: brandIdeas })])).rows[0];
  const projects: { id: string; channel: string; topic: string }[] = [];
  for (const [ch, ideas] of [[attn, attention], [brand, brandIdeas]] as const) {
    for (const idea of ideas) {
      const p = (await db.query(
        "insert into projects (title, format, topic, status, channel_id, batch_id, brief) values ($1,'short',$2,'draft',$3,$4,$5) returning id",
        [idea.topic.slice(0, 120), idea.topic, ch.id, batch.id, JSON.stringify({ style: idea.style, hook_idea: idea.hook_idea, hypothesis: (idea as any).hypothesis, dataset: idea.dataset ?? null })],
      )).rows[0];
      await enqueue("produce_project", { projectId: p.id }, { idempotencyKey: `produce:${p.id}` });
      projects.push({ id: p.id, channel: ch.name, topic: idea.topic });
    }
  }
  return { batchId: batch.id as string, projects };
}

export async function batchStatus() {
  return (await getPool().query(
    `select b.id, b.created_at,
       coalesce(json_agg(json_build_object('id',p.id,'title',p.title,'status',p.status,'stage',p.pipeline->>'stage','blockers',p.pipeline->'blockers','channel',c.name,'kind',c.kind,'style',p.brief->>'style','hypothesis',p.brief->>'hypothesis') order by c.kind, p.created_at) filter (where p.id is not null),'[]') as projects
     from batches b left join projects p on p.batch_id=b.id left join channels c on c.id=p.channel_id
     group by b.id order by b.created_at desc limit 10`)).rows;
}
