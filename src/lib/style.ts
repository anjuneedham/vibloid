import fs from "node:fs";
import path from "node:path";
import { getPool } from "./db";
import type { ScriptBody } from "./scripts";

const words = (t: string) => t.toLowerCase().replace(/\[citation needed\]/g, " ").replace(/[^a-z0-9'\s]/g, " ").split(/\s+/).filter(Boolean);
const shingles = (t: string, n: number) => {
  const w = words(t), out = new Set<string>();
  for (let i = 0; i + n <= w.length; i++) out.add(w.slice(i, i + n).join(" "));
  return out;
};

/** Share of this script's n-word phrases that already appear in `prior` (0..1). High = recycled writing. */
export function overlapRatio(text: string, prior: string[], n = 6): number {
  const mine = shingles(text, n);
  if (!mine.size) return 0;
  const seen = new Set<string>();
  for (const p of prior) for (const s of shingles(p, n)) seen.add(s);
  let hit = 0;
  for (const s of mine) if (seen.has(s)) hit++;
  return hit / mine.size;
}

export const MAX_OVERLAP = Number(process.env.MAX_SCRIPT_OVERLAP ?? 0.08);

const flat = (b: ScriptBody) => [b.hook, b.promise, ...b.beats.map((x) => x.narration), b.cta].join(" ");

/** Previously written scripts (own channel history) as text, newest first. */
export async function priorScriptTexts(excludeProjectId?: string, limit = 40): Promise<string[]> {
  const rows = (await getPool().query(
    "select distinct on (s.project_id) s.body from scripts s where ($1::uuid is null or s.project_id <> $1) order by s.project_id, s.version desc limit $2", [excludeProjectId ?? null, limit])).rows;
  return rows.map((r) => flat(r.body));
}

/** Voice reference: a few earlier hooks/openings to match tone and cadence. Told explicitly not to copy. */
export async function styleContext(excludeProjectId?: string): Promise<string> {
  const rows = (await getPool().query(
    "select distinct on (s.project_id) s.body from scripts s join projects p on p.id=s.project_id where p.status in ('approved','scheduled','published','packaged','rendered') and ($1::uuid is null or s.project_id <> $1) order by s.project_id, s.version desc limit 4", [excludeProjectId ?? null])).rows;
  if (!rows.length) return "";
  const ex = rows.map((r) => `- Hook: "${r.body.hook}"\n  Opening beat: "${String(r.body.beats?.[0]?.narration ?? "").slice(0, 220)}"`).join("\n");
  return `STYLE REFERENCE (our earlier scripts). Match the voice, sentence length and pacing. Do NOT reuse any sentence or distinctive phrase; the content must be new.\n${ex}`;
}

/** Template guidance from specs/james-templates.json: the structure to follow, never the wording. */
export function templateContext(angle?: string, file = "specs/james-templates.json"): string {
  let j: any;
  try { j = JSON.parse(fs.readFileSync(path.resolve(file), "utf8")); } catch { return ""; }
  const pick = (j.templates ?? []).find((t: any) => angle && t.angle === angle) ?? (j.templates ?? [])[0];
  if (!pick) return "";
  const beats = (pick.beats ?? []).map((b: any) => `${b.n}. ${b.beat}`).join("\n");
  return `TEMPLATE (structure only; expand the beats to fit long-form, write fresh content): "${pick.name}" (angle: ${pick.angle})\nHook pattern: ${pick.hook_pattern}\nBeats:\n${beats}`;
}
