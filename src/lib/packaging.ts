import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { getPool } from "./db";
import { getLLM, type LLM } from "./llm";
import { getImageProvider, type ImageProvider } from "./providers/images";
import { getStorage } from "./storage";
import { renderThumbnail, type ThumbLayout } from "./thumbnail";
import { scriptText, type ScriptBody } from "./scripts";
import { logCost } from "./queue";
import { channelForProject } from "./channels";
import type { Timeline } from "./timeline";

export const DISCLAIMER = "This video is for educational and entertainment purposes only and is not financial, investment, tax or legal advice. Investing involves risk, including loss of principal. Past performance does not guarantee future results. Do your own research or speak to a licensed professional.";
export const TRADING_RISK = "Trading and investing involve substantial risk of loss and are not suitable for everyone. Examples are educational and not a recommendation to buy or sell anything. Past results do not predict future results. You can lose more than you put in.";
export const GOLD_RISK = "Gold and other precious metals can fall as well as rise in price, and holding them carries storage, spread and liquidity costs. Nothing here is a recommendation to buy or sell, and nothing predicts future prices. Past performance does not guarantee future results.";
export const AI_DISCLOSURE = "Narration and some visuals in this video are AI-generated or AI-assisted.";

const PackOut = z.object({
  titles: z.array(z.object({ title: z.string(), angle: z.string().optional() })).min(3).max(15),
  top3: z.array(z.object({ title: z.string(), reasoning: z.string() })).min(1).max(5),
  description: z.string(),
  tags: z.array(z.string()).max(30),
  thumbnail_concepts: z.array(z.object({ text: z.string(), subject_query: z.string(), layout: z.enum(["left", "center", "bottom"]) })).min(1).max(3).optional(),
});
const ThumbOut = z.object({ thumbnail_concepts: z.array(z.object({ text: z.string(), subject_query: z.string(), layout: z.enum(["left", "center", "bottom"]) })).min(1).max(3) });
const JudgeOut = z.object({ results: z.array(z.object({ title: z.string(), delivers: z.boolean(), issues: z.array(z.string()).default([]) })) });

const COUNT = /\b(\d+)\s+(ways|habits|tips|rules|steps|things|mistakes|lessons|reasons|secrets|myths|ideas|strategies|principles)\b/i;

/** Deterministic checks that a title's concrete promises appear in the script. */
export function titleRuleCheck(title: string, script: ScriptBody): string[] {
  const issues: string[] = [];
  const text = scriptText(script).toLowerCase();
  if (title.length > 60) issues.push("title longer than 60 characters");
  if (title.length < 15) issues.push("title shorter than 15 characters");
  const c = title.match(COUNT);
  if (c && Number(c[1]) !== script.beats.length) issues.push(`title promises ${c[1]} ${c[2]} but the script has ${script.beats.length}`);
  for (const m of title.match(/\$[\d,.]+\s?(k|m|million|thousand)?/gi) ?? []) {
    if (!text.includes(m.toLowerCase().trim())) issues.push(`title mentions ${m.trim()} which the script never says`);
  }
  for (const m of title.match(/\b(in|within) \d+ (days?|weeks?|months?|years?)\b/gi) ?? []) {
    if (!text.includes(m.toLowerCase().replace(/^(in|within) /, ""))) issues.push(`title promises a timeframe ("${m}") the script does not support`);
  }
  for (const w of ["guaranteed", "overnight", "millionaire", "secret", "they don't want"]) {
    if (title.toLowerCase().includes(w) && !text.includes(w)) issues.push(`title uses "${w}" but the script does not`);
  }
  return issues;
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/** Long-form only. YouTube needs 3+ chapters, first at 0:00, each at least 10s. */
export function buildChapters(tl: Timeline | null): string {
  if (!tl || tl.format !== "long") return "";
  const secs = tl.segments.filter((s) => s.kind !== "promise");
  const ch = secs.map((s, i) => ({ t: i === 0 ? 0 : s.start, label: s.onScreenText ?? (s.kind === "hook" ? "Intro" : s.kind === "cta" ? "Wrap-up" : s.text.split(/\s+/).slice(0, 6).join(" ")) }));
  const ok = ch.filter((c, i) => i === 0 || c.t - ch[i - 1].t >= 10);
  return ok.length >= 3 ? "Chapters:\n" + ok.map((c) => `${fmt(c.t)} ${c.label}`).join("\n") : "";
}

export async function buildPackaging(projectId: string, opts: { llm?: LLM; images?: ImageProvider; jobId?: string } = {}) {
  const db = getPool(), storage = getStorage(), llm = opts.llm ?? getLLM();
  const p = (await db.query("select * from projects where id=$1", [projectId])).rows[0];
  const sc = (await db.query("select * from scripts where project_id=$1 order by version desc limit 1", [projectId])).rows[0];
  if (!p || !sc) throw new Error("project with a script required");
  const script: ScriptBody = sc.body;
  const tlRow = (await db.query("select storage_key from assets where project_id=$1 and kind='timeline' order by created_at desc limit 1", [projectId])).rows[0];
  const tl: Timeline | null = tlRow ? JSON.parse(fs.readFileSync(storage.localPath(tlRow.storage_key), "utf8")) : null;

  const scriptStr = `HOOK: ${script.hook}\nPROMISE: ${script.promise}\n${script.beats.map((b, i) => `${i + 1}. ${b.narration}`).join("\n")}\nCTA: ${script.cta}`;
  const pack = await llm.json({ system: fs.readFileSync(path.resolve("prompts/packaging.md"), "utf8"), user: `Format: ${p.format}\nTopic: ${p.topic ?? p.title}\n\nSCRIPT:\n${scriptStr}`, schema: PackOut, maxTokens: 3000, role: "main" });
  await logCost({ jobId: opts.jobId, projectId, provider: "anthropic", unit: "tokens", quantity: pack.usage.inputTokens + pack.usage.outputTokens, costUsd: pack.usage.costUsd });

  // Promise-delivery validator: rules first, then an LLM judge on what survives.
  const candidates = pack.data.top3.map((t) => t.title);
  const ruled = candidates.map((title) => ({ title, issues: titleRuleCheck(title, script) }));
  const survivors = ruled.filter((r) => r.issues.length === 0).map((r) => r.title);
  const judged = new Map<string, { delivers: boolean; issues: string[] }>();
  if (survivors.length) {
    const j = await llm.json({ system: fs.readFileSync(path.resolve("prompts/promise-check.md"), "utf8"), user: `TITLES:\n${survivors.map((t) => `- ${t}`).join("\n")}\n\nSCRIPT:\n${scriptStr}`, schema: JudgeOut, role: "light" });
    await logCost({ jobId: opts.jobId, projectId, provider: "anthropic", unit: "tokens", quantity: j.usage.inputTokens + j.usage.outputTokens, costUsd: j.usage.costUsd });
    j.data.results.forEach((r) => judged.set(r.title, r));
  }
  const promiseCheck = ruled.map((r) => {
    const j = judged.get(r.title);
    const issues = [...r.issues, ...(j && !j.delivers ? j.issues.length ? j.issues : ["judge: script does not deliver the title's promise"] : [])];
    return { title: r.title, ok: issues.length === 0 && (!!j?.delivers), issues };
  });
  const chosen = promiseCheck.find((c) => c.ok)?.title ?? null;

  // Thumbnail concepts: the click-deciding asset gets the visual model (Fable); falls back to the main model's concepts.
  const event = p.brief?.current_event ? `\nCURRENT_EVENT (hint at it only with neutral, factual visuals): ${String(p.brief.current_event).slice(0, 300)}` : "";
  const thumbs = await llm.json({ system: fs.readFileSync(path.resolve("prompts/packaging.md"), "utf8") + `\nFor this call output ONLY: {"thumbnail_concepts":[...]} (exactly 3).`, user: `Format: ${p.format}\nTopic: ${p.topic ?? p.title}\nBest titles: ${pack.data.top3.map((t) => t.title).join(" | ")}${event}\n\nSCRIPT:\n${scriptStr}`, schema: ThumbOut, maxTokens: 1500, role: "visual" }).catch(() => null);
  if (thumbs) await logCost({ jobId: opts.jobId, projectId, provider: "anthropic", unit: "tokens", quantity: thumbs.usage.inputTokens + thumbs.usage.outputTokens, costUsd: thumbs.usage.costUsd });
  const thumbConcepts = thumbs?.data.thumbnail_concepts ?? pack.data.thumbnail_concepts ?? [];
  if (!thumbConcepts.length) throw new Error("no thumbnail concepts returned");

  // Thumbnails
  const images = opts.images ?? getImageProvider();
  await db.query("delete from assets where project_id=$1 and kind='thumbnail'", [projectId]);
  const concepts: any[] = [];
  for (let i = 0; i < thumbConcepts.length; i++) {
    const c = thumbConcepts[i];
    const words = c.text.trim().split(/\s+/).slice(0, 4); // hard cap at 4 words
    const bgKey = `projects/${projectId}/thumb-bg${i}.png`;
    const lic = (await images.fetch(c.subject_query, storage.localPath(bgKey), { orientation: "landscape" })).license;
    const key = `projects/${projectId}/thumb${i}.png`;
    const r = await renderThumbnail({ bgPath: storage.localPath(bgKey), outPath: storage.localPath(key), text: words.join(" "), layout: c.layout as ThumbLayout });
    await db.query("insert into assets (project_id,kind,storage_key,license,meta) values ($1,'thumbnail',$2,$3,$4)", [projectId, key, JSON.stringify(lic), JSON.stringify({ text: r.text, contrast: r.contrast })]);
    concepts.push({ ...c, text: r.text, key, contrast: r.contrast });
  }

  const credits = (await db.query("select license from assets where project_id=$1 and kind in ('image','video','thumbnail') and license->>'source' not in ('generated')", [projectId])).rows
    .map((r) => r.license).filter((l) => l.author).map((l) => `Image: ${l.author} (${l.source})`);
  const attributions = [...new Set((await db.query("select distinct s.attribution, s.url from clips c join sources s on s.id=c.source_id where c.id = any($1) and s.attribution is not null", [p.clip_ids])).rows.map((r) => `Clip source: ${r.attribution}${r.url ? " - " + r.url : ""}`))];
  const ch = await channelForProject(projectId);
  const description = [pack.data.description.trim(), buildChapters(tl), [...attributions, ...[...new Set(credits)]].join("\n"), ch?.disclosure?.description_footer, AI_DISCLOSURE, DISCLAIMER, ch?.niche === "trading" ? TRADING_RISK : "", ch?.niche === "gold" ? GOLD_RISK : ""].filter(Boolean).join("\n\n");

  await db.query(
    `insert into packaging (project_id,titles,chosen_title,description,tags,thumbnail_concepts,promise_check) values ($1,$2,$3,$4,$5,$6,$7)
     on conflict (project_id) do update set titles=excluded.titles, chosen_title=excluded.chosen_title, description=excluded.description, tags=excluded.tags,
       thumbnail_concepts=excluded.thumbnail_concepts, promise_check=excluded.promise_check, updated_at=now()`,
    [projectId, JSON.stringify(pack.data.titles), chosen, description, pack.data.tags, JSON.stringify(concepts), JSON.stringify(promiseCheck)],
  );
  if (chosen) await db.query("update projects set status='packaged' where id=$1 and status in ('rendered','assembled','packaged')", [projectId]);
  return { chosen, promiseCheck, concepts, description };
}
