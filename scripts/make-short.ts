/**
 * Spec-driven Short generator: one JSON file in, a finished animated Short (voice + captions + scenes) out.
 * Built for testing lots of content across lots of channels: copy a spec, change the words, run.
 *
 *   TTS_PROVIDER=kokoro pnpm exec tsx scripts/make-short.ts specs/money-first-100.json [more specs...]
 *
 * Output per spec: output/shorts/<slug>/<slug>.mp4, .srt, .vtt, -cover.png, POST-COPY.md
 * No language-model API and no footage: voice is local, every visual is drawn in code.
 * The platform's own safety checks still apply (claims lint, fact-check items, ownership disclosure for brand channels).
 */
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const ADMIN = process.env.E2E_ADMIN_URL ?? "postgres://postgres@localhost:5433/postgres";
const DB = process.env.SHORTS_DB ?? "vibloid_shorts";
process.env.DATABASE_URL = ADMIN.replace(/\/[^/]*$/, `/${DB}`);

const { getPool, closePool } = await import("../src/lib/db");
const { migrate } = await import("./migrate");
const { setStorage, LocalStorage } = await import("../src/lib/storage");
const { createChannel } = await import("../src/lib/channels");
const { createDataset } = await import("../src/lib/datasets");
const { createProject, saveScript, ScriptBody, renderBlockers } = await import("../src/lib/scripts");
const { assembleProject } = await import("../src/lib/assemble");
const { renderProject } = await import("../src/lib/render");
const { DISCLAIMER, TRADING_RISK, AI_DISCLOSURE } = await import("../src/lib/packaging");
const { kokoroWorker } = await import("../src/lib/providers/tts");
const { run, probeDuration } = await import("../src/lib/media");

type Spec = {
  slug: string; title: string;
  channel: { name: string; kind?: "attention" | "brand"; niche?: string; appName?: string; appBlurb?: string };
  style?: { preset?: "andrew" | "bold"; accent?: string; bg?: string };
  body: unknown;
  datasets?: { name: string; source: string; kind?: "ohlc" | "series"; csv?: string; points?: any[]; as_of?: string }[];
  post: { ytTitle: string; ytDesc: string; tiktok: string; tags: string[]; hashtags: string[]; tiktokHashtags?: string[]; pinnedComment?: string; checklist?: string[] };
};

const files = process.argv.slice(2);
if (!files.length) { console.error("usage: make-short.ts <spec.json> [...]"); process.exit(2); }

// Persistent database (not wiped): channels and projects accumulate so you can compare tests over time.
const admin = new pg.Client({ connectionString: ADMIN }); await admin.connect();
if (!(await admin.query("select 1 from pg_database where datname=$1", [DB])).rowCount) await admin.query(`create database ${DB}`);
await admin.end();
await migrate();
const root = path.resolve("storage/shorts");
setStorage(new LocalStorage(root));
const db = getPool();

const summary: any[] = [];
for (const file of files) {
  const spec: Spec = JSON.parse(fs.readFileSync(file, "utf8"));
  const accent = spec.style?.accent, bg = spec.style?.bg;
  const existing = (await db.query("select * from channels where name=$1", [spec.channel.name])).rows[0];
  const channel = existing ?? (await createChannel({ ...spec.channel, appName: spec.channel.appName, appBlurb: spec.channel.appBlurb }));

  for (const d of spec.datasets ?? []) await createDataset({ ...d });

  // Apply the channel look to every scene that doesn't set its own theme.
  const body: any = JSON.parse(JSON.stringify(spec.body));
  const themed = (sc: any) => (sc && !sc.theme && (accent || bg) ? { ...sc, theme: { accent, bg } } : sc);
  body.scenes = Object.fromEntries(Object.entries(body.scenes ?? {}).map(([k, v]) => [k, themed(v)]));
  body.beats = (body.beats ?? []).map((b: any) => (b.scene ? { ...b, scene: themed(b.scene) } : b));
  const parsed = ScriptBody.parse(body);

  const project = await createProject({ title: spec.title, format: "short", topic: spec.title, channelId: channel.id });
  const script = await saveScript(project.id, parsed);
  const blockers = renderBlockers(script.body, script.fact_check_items, channel);
  if (blockers.length) throw new Error(`${spec.slug} is blocked by the platform's own checks: ${blockers.join("; ")}`);

  const style = { captions: spec.style?.preset ?? ("bold" as const), highlight: accent, dipColor: bg ?? "#0A0F1A", dipS: 0.22, lufs: -16, tp: -2.4, crf: 20, endHoldS: 2 };
  const t0 = Date.now();
  const tl = await assembleProject(project.id, { style });
  const r = await renderProject(project.id, "final");
  const dir = path.resolve("output/shorts", spec.slug);
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const mp4 = path.join(dir, `${spec.slug}.mp4`);
  fs.copyFileSync(path.join(root, r.storage_key), mp4);
  for (const ext of ["srt", "vtt"]) fs.copyFileSync(path.join(root, `projects/${project.id}/captions.${ext}`), path.join(dir, `${spec.slug}.${ext}`));
  await run("ffmpeg", ["-v", "error", "-y", "-ss", "1.6", "-i", mp4, "-frames:v", "1", path.join(dir, `${spec.slug}-cover.png`)]);

  const dur = await probeDuration(mp4);
  const probe = await run("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate", "-of", "csv=p=0", mp4]);
  const loud = await run("ffmpeg", ["-i", mp4, "-af", "ebur128=peak=true", "-f", "null", "-"]);
  const lufs = Number(loud.stderr.match(/I:\s+(-?[\d.]+) LUFS/g)!.pop()!.match(/(-?[\d.]+)/)![1]);
  const peak = Number(loud.stderr.match(/Peak:\s+(-?[\d.]+) dBFS/g)!.pop()!.match(/(-?[\d.]+)/)![1]);
  const words = [parsed.hook, parsed.promise, ...parsed.beats.map((b) => b.narration), parsed.cta].join(" ").split(/\s+/).length;
  const qa = { durationS: +dur.toFixed(1), ok20to45s: dur >= 20 && dur <= 45, frame: probe.stdout.trim(), lufs, loudnessOk: Math.abs(lufs + 16) <= 1, peakDb: peak, peakOk: peak <= -1.5, words };

  const footer = channel.disclosure?.description_footer as string | undefined;
  fs.writeFileSync(path.join(dir, "POST-COPY.md"), `# ${spec.slug}  (${spec.channel.name})

Files: \`${spec.slug}.mp4\` (1080x1920, 30 fps, captions burned in), \`.srt\` / \`.vtt\`, \`${spec.slug}-cover.png\`.

## YouTube Shorts
**Title:** ${spec.post.ytTitle}

**Description:**
${spec.post.ytDesc}

${footer ? footer + "\n\n" : ""}${AI_DISCLOSURE}

${DISCLAIMER}
${channel.niche === "trading" ? "\n" + TRADING_RISK + "\n" : ""}
${spec.post.hashtags.join(" ")} #shorts

**Tags:** ${spec.post.tags.join(", ")}

## TikTok
**Caption:** ${spec.post.tiktok} ${(spec.post.tiktokHashtags ?? spec.post.hashtags.slice(0, 3)).join(" ")}
${spec.post.pinnedComment ? `\n## Pinned comment (both platforms; put the link here)\n${spec.post.pinnedComment}\n` : ""}
## Before you post
${(spec.post.checklist ?? []).map((c) => `- [ ] ${c}\n`).join("")}- [ ] You approve every claim in the script. Nothing here promises income; keep it that way if you edit.
- [ ] TikTok: turn on the **AI-generated content** label (synthetic voice). ${channel.kind === "brand" ? "Also set commercial content disclosure -> Your brand." : "No brand/paid-promotion toggle needed unless you add a sponsor or your own product."}
- [ ] YouTube: audience "No, it's not made for kids"; consider the altered/synthetic content disclosure for the AI voice (check the current wording).
- [ ] Log this test (hook, format, posting time) so the analytics loop can tell you what held attention.
`);
  summary.push({ slug: spec.slug, channel: spec.channel.name, build: `${((Date.now() - t0) / 1000).toFixed(0)}s`, qa, segments: tl.segments.map((s) => s.visual.type) });
}
kokoroWorker.close();
console.log(JSON.stringify(summary, null, 2));
await closePool();
