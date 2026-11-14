import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { getPool } from "./db";
import { getLLM, type LLM } from "./llm";
import { logCost } from "./queue";
import { winnersContext } from "./analytics";
import { channelForProject } from "./channels";

export const STYLES = {
  seven_habits: "Listicle: '7 money habits ...' style; each beat is one habit with a concrete example and number.",
  story_motivation: "Story-driven: open mid-scene on a person's turning point (fictional composite, say so), then extract 3 lessons.",
  explained_simply: "Explainer: take one concept (compound interest, inflation, index funds, emergency funds) and explain it with an analogy and a worked example.",
  myth_vs_reality: "Myth vs reality: each beat states a common money myth, then the more accurate picture with a checkable fact.",
} as const;
export type Style = keyof typeof STYLES;

export const VISUAL_TYPES = ["stock_video", "image", "chart", "ai_image", "ai_clip", "scene"] as const;
const Beat = z.object({
  narration: z.string().min(1), on_screen_text: z.string().max(60).optional(), visual_query: z.string().min(1), clip_ref: z.string().optional(),
  visual_type: z.enum(VISUAL_TYPES).optional(),
  chart: z.object({ dataset: z.string(), kind: z.enum(["line", "candles", "bars", "counter"]).default("line"), title: z.string().max(80).optional(), unit: z.string().max(4).optional(), accent: z.string().optional(), bg: z.string().optional() }).optional(),
  ai_prompt: z.string().max(400).optional(),
  scene: z.record(z.string(), z.any()).optional(), // code-drawn animation (see scenes.ts), used when visual_type is "scene"
});
export const ScriptBody = z.object({
  hook: z.string().min(1), promise: z.string().min(1), beats: z.array(Beat).min(3).max(12), cta: z.string(),
  claims: z.array(z.object({ text: z.string(), needs_source: z.boolean() })).default([]),
  scenes: z.object({ hook: z.record(z.string(), z.any()).optional(), promise: z.record(z.string(), z.any()).optional(), cta: z.record(z.string(), z.any()).optional() }).optional(),
});
export type ScriptBody = z.infer<typeof ScriptBody>;

export type FactItem = { id: string; kind: "claim" | "marker" | "policy"; text: string; resolved: boolean; source?: string };

const BANNED: [RegExp, string][] = [
  [/guaranteed (returns?|profits?|income)/i, "guaranteed returns"], [/risk[- ]free/i, "risk-free claim"], [/can'?t lose/i, "'can't lose' claim"],
  [/get rich quick/i, "get-rich-quick language"], [/\b(you will|you'll) (definitely|certainly) (be|become) (rich|a millionaire)/i, "promise of becoming rich"],
  [/\b100% (return|profit|success)/i, "100% return/success claim"], [/\bpassive income (while you sleep|on autopilot)\b/i, "autopilot-income hype"],
  // Trading-specific: performance and copy-trading claims
  [/\b\d{2,3}\s?% win rate\b/i, "win-rate claim"], [/\b(never|always|rarely) (lose|lost|losing|loses)\b/i, "never-lose claim"],
  [/\b(copy|follow|mirror) my (trades?|positions?|picks?|signals?)\b/i, "copy-trading call to action"],
  [/\b(10x|100x|1000x) your (account|money|portfolio)\b/i, "multiplier claim"], [/\bquit your (9[- ]?to[- ]?5|job)\b/i, "quit-your-job hype"],
  [/\b(sure thing|can'?t fail|free money|easy money|insider (tip|info))\b/i, "sure-thing / free-money claim"],
  [/\bI (made|earned|turned|profited|banked) \$?[\d,]+/i, "personal earnings claim (not allowed in scripts)"],
  [/\bprofit(s)? (every|each) (single )?(day|week|trade)\b/i, "consistent-profit claim"],
];

export function scriptText(b: ScriptBody) {
  return [b.hook, b.promise, ...b.beats.map((x) => x.narration), b.cta].join(" ");
}
export const wordCount = (b: ScriptBody) => scriptText(b).split(/\s+/).filter(Boolean).length;

/** Ownership wording required when a channel promotes the creator's own product. */
const OWNERSHIP = /\b(my (own )?app|I (built|made|created|own|run|founded)|our app|(my|our) (product|tool))\b/i;

export function lintScript(b: ScriptBody, channel?: { kind?: string } | null): string[] {
  const t = scriptText(b);
  const out = BANNED.filter(([re]) => re.test(t)).map(([, label]) => label);
  if (channel?.kind === "brand" && !OWNERSHIP.test(t)) out.push("missing spoken ownership disclosure (say that this is your own app)");
  return out;
}

const MARKER = /\[CITATION NEEDED\]/g;

/** Build the fact-check list from model claims + any leftover markers + policy violations. */
export function buildFactItems(b: ScriptBody, channel?: { kind?: string } | null): FactItem[] {
  const items: FactItem[] = [];
  b.claims.filter((c) => c.needs_source).forEach((c, i) => items.push({ id: `claim-${i}`, kind: "claim", text: c.text, resolved: false }));
  const markers = (scriptText(b).match(MARKER) ?? []).length;
  if (markers > items.length) for (let i = items.length; i < markers; i++) items.push({ id: `marker-${i}`, kind: "marker", text: "Unresolved [CITATION NEEDED] marker", resolved: false });
  lintScript(b, channel).forEach((v, i) => items.push({ id: `policy-${i}`, kind: "policy", text: `Policy: ${v}. Rewrite the line.`, resolved: false }));
  return items;
}

/** Anything that stops a render. */
export function renderBlockers(b: ScriptBody, items: FactItem[], channel?: { kind?: string } | null): string[] {
  const out: string[] = [];
  const open = items.filter((i) => !i.resolved);
  if (open.length) out.push(`${open.length} unresolved fact-check item(s)`);
  if ((scriptText(b).match(MARKER) ?? []).length) out.push("[CITATION NEEDED] markers remain in the script");
  lintScript(b, channel).forEach((v) => out.push(`policy violation: ${v}`));
  return out;
}

export async function createProject(input: { title: string; format: "short" | "long"; topic?: string; clipIds?: string[]; channelId?: string }) {
  const r = await getPool().query(`insert into projects (title,format,topic,clip_ids,channel_id) values ($1,$2,$3,$4,$5) returning *`,
    [input.title, input.format, input.topic ?? null, input.clipIds ?? [], input.channelId ?? null]);
  return r.rows[0];
}

async function nextVersion(projectId: string) {
  const r = await getPool().query("select coalesce(max(version),0)+1 as v from scripts where project_id=$1", [projectId]);
  return Number(r.rows[0].v);
}

export async function saveScript(projectId: string, body: ScriptBody, items?: FactItem[]) {
  const v = await nextVersion(projectId);
  const facts = items ?? buildFactItems(body, await channelForProject(projectId));
  const r = await getPool().query("insert into scripts (project_id,version,body,fact_check_items) values ($1,$2,$3,$4) returning *", [projectId, v, JSON.stringify(body), JSON.stringify(facts)]);
  await getPool().query("update projects set status='scripted' where id=$1 and status in ('draft','scripted')", [projectId]);
  return r.rows[0];
}

export async function generateScript(projectId: string, opts: { style: Style; llm?: LLM; jobId?: string; feedback?: string }) {
  const db = getPool();
  const p = (await db.query("select * from projects where id=$1", [projectId])).rows[0];
  if (!p) throw new Error("project not found");
  const clips = p.clip_ids.length ? (await db.query("select c.id,c.start_s,c.end_s,c.hook_text,t.words from clips c left join transcripts t on t.source_id=c.source_id where c.id = any($1)", [p.clip_ids])).rows : [];
  const clipTxt = clips.map((c: any) => {
    const text = (c.words ?? []).filter((w: any) => w.start >= Number(c.start_s) - 0.01 && w.end <= Number(c.end_s) + 0.01).map((w: any) => w.w).join(" ");
    return `- clip_ref ${c.id}: "${text}"`;
  }).join("\n");
  const length = p.format === "short" ? "SHORT (about 150 words, under 60 seconds)" : "LONG-FORM (1200-1800 words)";
  const user = `Topic: ${p.topic ?? p.title}\nFormat: ${length}\nStyle: ${STYLES[opts.style]}\n${clipTxt ? `\nClips you may reference as evidence/quotes (inside your own commentary):\n${clipTxt}\n` : ""}${p.brief?.hook_idea ? `\nHook idea from the weekly plan: ${p.brief.hook_idea}\n` : ""}${opts.feedback ? `\nRevision feedback: ${opts.feedback}\n` : ""}`;
  const winners = await winnersContext();
  const channel = await channelForProject(projectId);
  const datasets = (await db.query("select name, kind, source, as_of from datasets order by created_at desc limit 40")).rows;
  const read = (f: string) => fs.readFileSync(path.resolve(f), "utf8");
  const addenda = [
    read("prompts/visuals.md") + `\nAVAILABLE DATASETS:\n${datasets.length ? datasets.map((d: any) => `- "${d.name}" (${d.kind}; source: ${d.source}${d.as_of ? `; as of ${d.as_of}` : ""})`).join("\n") : "(none: do not use charts)"}`,
    channel?.niche === "trading" ? read("prompts/trading.md") : "",
    channel?.kind === "brand" ? read("prompts/brand.md").replaceAll("{{APP}}", channel.voice?.app?.name ?? "the app").replaceAll("{{BLURB}}", channel.voice?.app?.blurb ? `(${channel.voice.app.blurb})` : "") : "",
    winners,
  ].filter(Boolean);
  const system = read("prompts/script.md") + "\n\n" + addenda.join("\n\n");
  const { data, usage } = await (opts.llm ?? getLLM()).json({ system, user, schema: ScriptBody, maxTokens: p.format === "short" ? 2500 : 8000 });
  await logCost({ jobId: opts.jobId, projectId, provider: "anthropic", unit: "tokens", quantity: usage.inputTokens + usage.outputTokens, costUsd: usage.costUsd });
  return saveScript(projectId, data);
}

export async function resolveFactItem(scriptId: string, itemId: string, input: { source: string; replacement?: { find: string; with: string } }) {
  const s = (await getPool().query("select * from scripts where id=$1", [scriptId])).rows[0];
  if (!s) throw new Error("script not found");
  if (!input.source?.trim()) throw new Error("a source/citation is required to resolve an item");
  const items: FactItem[] = s.fact_check_items;
  const it = items.find((i) => i.id === itemId);
  if (!it) throw new Error("item not found");
  if (it.kind === "policy") throw new Error("policy items are resolved by editing the script, not by citing a source");
  const body: ScriptBody = s.body;
  // remove exactly one marker so the marker count tracks unresolved items
  let removed = false;
  const strip = (t: string) => t.replace(/\s*\[CITATION NEEDED\]/, (m) => (removed ? m : ((removed = true), "")));
  body.hook = strip(body.hook); body.promise = strip(body.promise); body.cta = strip(body.cta);
  body.beats = body.beats.map((b) => ({ ...b, narration: strip(b.narration) }));
  it.resolved = true; it.source = input.source;
  const v = await nextVersion(s.project_id);
  const r = await getPool().query("insert into scripts (project_id,version,body,fact_check_items) values ($1,$2,$3,$4) returning *", [s.project_id, v, JSON.stringify(body), JSON.stringify(items)]);
  return r.rows[0];
}

/** Edit narration text => new version; fact items are rebuilt but previously resolved claims stay resolved. */
export async function editScript(projectId: string, body: ScriptBody) {
  const prev = (await getPool().query("select fact_check_items from scripts where project_id=$1 order by version desc limit 1", [projectId])).rows[0];
  const fresh = buildFactItems(body, await channelForProject(projectId));
  const resolved = new Map<string, FactItem>((prev?.fact_check_items ?? []).filter((i: FactItem) => i.resolved && i.kind !== "policy").map((i: FactItem) => [i.text, i]));
  const merged = fresh.map((i) => (resolved.has(i.text) ? resolved.get(i.text)! : i));
  return saveScript(projectId, body, merged);
}

export function diffScripts(a: ScriptBody, b: ScriptBody) {
  const rows: { part: string; before?: string; after?: string }[] = [];
  const cmp = (part: string, x?: string, y?: string) => { if (x !== y) rows.push({ part, before: x, after: y }); };
  cmp("hook", a.hook, b.hook); cmp("promise", a.promise, b.promise); cmp("cta", a.cta, b.cta);
  const n = Math.max(a.beats.length, b.beats.length);
  for (let i = 0; i < n; i++) cmp(`beat ${i + 1}`, a.beats[i]?.narration, b.beats[i]?.narration);
  return rows;
}
