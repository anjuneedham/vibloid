import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { getPool } from "./db";
import { getLLM, type LLM } from "./llm";
import { logCost } from "./queue";
import type { Word } from "./providers/transcript";

export const ClipCandidate = z.object({
  start_s: z.number().min(0),
  end_s: z.number(),
  hook_text: z.string().max(200),
  why_it_works: z.string(),
  topic_tags: z.array(z.string()).default([]),
  sub_scores: z.object({
    hook_strength: z.number().min(0).max(100), standalone_clarity: z.number().min(0).max(100),
    emotional_payload: z.number().min(0).max(100), quotability: z.number().min(0).max(100),
  }),
  score: z.number().min(0).max(100),
  risk_flags: z.array(z.string()).default([]),
});
export const ClipResponse = z.object({ clips: z.array(ClipCandidate).min(1).max(30) });
export type ClipCandidate = z.infer<typeof ClipCandidate>;

const END = /[.!?]["')\]]?$/;

/** Sentence start indices: index 0 and any word following a sentence-ending word. */
function sentenceStarts(words: Word[]) {
  const s: number[] = [0];
  words.forEach((w, i) => { if (END.test(w.w) && i + 1 < words.length) s.push(i + 1); });
  return s;
}

/** Snap [start,end] to the nearest sentence start / sentence end using word timings. */
export function snapClip(words: Word[], start: number, end: number): { start_s: number; end_s: number } {
  if (!words.length) return { start_s: start, end_s: end };
  const starts = sentenceStarts(words);
  let si = starts[0];
  for (const i of starts) if (Math.abs(words[i].start - start) < Math.abs(words[si].start - start)) si = i;
  const ends = words.map((w, i) => i).filter((i) => END.test(words[i].w) || i === words.length - 1);
  let ei = ends[0];
  for (const i of ends) if (Math.abs(words[i].end - end) < Math.abs(words[ei].end - end)) ei = i;
  if (ei < si) ei = Math.min(words.length - 1, si);
  return { start_s: words[si].start, end_s: words[ei].end };
}

export const LIMITS = { short: { min: 15, max: 60 }, long: { min: 60, max: 180 } } as const;

export function normalizeCandidates(words: Word[], cands: ClipCandidate[], format: "short" | "long") {
  const { min, max } = LIMITS[format];
  const out: (ClipCandidate & { start_s: number; end_s: number })[] = [];
  for (const c of cands) {
    const snapped = snapClip(words, c.start_s, c.end_s);
    const dur = snapped.end_s - snapped.start_s;
    if (dur < min * 0.8 || dur > max * 1.1) continue;
    if (out.some((o) => snapped.start_s < o.end_s && snapped.end_s > o.start_s)) continue; // overlap
    out.push({ ...c, ...snapped });
  }
  return out.sort((a, b) => b.score - a.score);
}

function transcriptForPrompt(words: Word[]) {
  // 1 line per sentence with timestamps keeps token use low and gives the model anchors.
  const lines: string[] = [];
  let cur: Word[] = [];
  for (const w of words) { cur.push(w); if (END.test(w.w)) { lines.push(`[${cur[0].start.toFixed(1)}-${cur[cur.length - 1].end.toFixed(1)}] ${cur.map((x) => x.w).join(" ")}`); cur = []; } }
  if (cur.length) lines.push(`[${cur[0].start.toFixed(1)}-${cur[cur.length - 1].end.toFixed(1)}] ${cur.map((x) => x.w).join(" ")}`);
  return lines.join("\n");
}

export async function selectClips(sourceId: string, format: "short" | "long", opts: { feedback?: string; llm?: LLM; jobId?: string } = {}) {
  const db = getPool();
  const t = (await db.query("select words from transcripts where source_id=$1", [sourceId])).rows[0];
  if (!t) throw new Error("no transcript for source");
  const words: Word[] = t.words;
  const rejected = (await db.query("select start_s,end_s,hook_text,reject_feedback from clips where source_id=$1 and status='rejected' order by created_at desc limit 8", [sourceId])).rows;
  const system = fs.readFileSync(path.resolve("prompts/clip-select.md"), "utf8");
  let user = `Format: ${format} (${LIMITS[format].min}-${LIMITS[format].max} seconds)\n\nTRANSCRIPT:\n${transcriptForPrompt(words)}`;
  if (rejected.length) user += `\n\nThe user REJECTED these earlier clips; avoid similar ones:\n` + rejected.map((r) => `- ${r.start_s}-${r.end_s} "${r.hook_text}" ${r.reject_feedback ? "(" + r.reject_feedback + ")" : ""}`).join("\n");
  if (opts.feedback) user += `\n\nUser feedback for this run: ${opts.feedback}`;
  const { data, usage } = await (opts.llm ?? getLLM()).json({ system, user, schema: ClipResponse, maxTokens: 6000 });
  await logCost({ jobId: opts.jobId, provider: "anthropic", unit: "tokens", quantity: usage.inputTokens + usage.outputTokens, costUsd: usage.costUsd });
  const clips = normalizeCandidates(words, data.clips, format).slice(0, 15);
  await db.query("delete from clips where source_id=$1 and status='candidate'", [sourceId]);
  for (const c of clips) {
    await db.query(
      `insert into clips (source_id,start_s,end_s,score,sub_scores,reason,hook_text,topic_tags,risk_flags) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [sourceId, c.start_s, c.end_s, Math.round(c.score), JSON.stringify(c.sub_scores), c.why_it_works, c.hook_text, c.topic_tags, c.risk_flags],
    );
  }
  return clips.length;
}

export async function updateClip(id: string, patch: { start_s?: number; end_s?: number; status?: "accepted" | "rejected" | "candidate"; reject_feedback?: string }) {
  const cur = (await getPool().query("select * from clips where id=$1", [id])).rows[0];
  if (!cur) throw new Error("clip not found");
  const start = patch.start_s ?? Number(cur.start_s), end = patch.end_s ?? Number(cur.end_s);
  if (!(end > start)) throw new Error("end must be after start");
  const r = await getPool().query(
    `update clips set start_s=$2,end_s=$3,status=coalesce($4,status),reject_feedback=coalesce($5,reject_feedback) where id=$1 returning *`,
    [id, start, end, patch.status ?? null, patch.reject_feedback ?? null],
  );
  return r.rows[0];
}
