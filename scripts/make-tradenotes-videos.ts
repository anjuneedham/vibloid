/**
 * Two fully-animated TradeNotes Shorts (YouTube Shorts + TikTok), following the rules in the TradeNotes repo's CONTENT_ENGINE.md:
 * Andrew Builds look, sample data always labelled, "not financial advice", no results claims, only features that exist today.
 * Usage: TTS_PROVIDER=kokoro pnpm exec tsx scripts/make-tradenotes-videos.ts
 * No language-model API and no footage: voice is local (Kokoro), every visual is drawn in code.
 */
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const ADMIN = process.env.E2E_ADMIN_URL ?? "postgres://postgres@localhost:5433/postgres";
const DB = "vibloid_tn";
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

const admin = new pg.Client({ connectionString: ADMIN }); await admin.connect();
await admin.query(`drop database if exists ${DB} with (force)`); await admin.query(`create database ${DB}`); await admin.end();
await migrate();
const root = path.resolve("storage/tn");
fs.rmSync(root, { recursive: true, force: true });
setStorage(new LocalStorage(root));

const channel = await createChannel({ name: "Andrew Builds (TradeNotes)", kind: "brand", niche: "trading", appName: "TradeNotes", appBlurb: "a trading journal and performance analytics app" });

// ---- Fair-coin simulation for video 2. Seeded and chosen so the story is TRUE: >=70% heads after 10 flips, ~50% after 300. ----
const mulberry = (a: number) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const flips = (seed: number, n: number): number[] => { const r = mulberry(seed); return Array.from({ length: n }, () => (r() < 0.5 ? 1 : 0)); };
let seed = 1;
for (; seed < 100000; seed++) {
  const f = flips(seed, 300), first10 = f.slice(0, 10).reduce((a, b) => a + b, 0), all = f.reduce((a, b) => a + b, 0);
  if (first10 === 7 && all >= 147 && all <= 153) break; // exactly 70% after 10 flips, ~50% after 300
}
const f = flips(seed, 300);
let heads = 0;
const share = f.map((x, i) => { heads += x; return { t: `flip ${i + 1}`, v: +((heads / (i + 1)) * 100).toFixed(1) }; });
const after10 = share[9].v, after300 = share[299].v;
console.log(`coin seed ${seed}: ${after10}% heads after 10 flips, ${after300}% after 300`);
// The narration says "seventy percent" and "settles near fifty": the data must say the same.
if (after10 !== 70 || after300 < 48 || after300 > 52) throw new Error(`simulation does not match the narration: ${after10}% / ${after300}%`);
await createDataset({ name: "Fair coin flips (simulation)", kind: "series", points: share, source: `Simulation: 300 fair coin flips (seed ${seed})` });

const STYLE = { captions: "andrew" as const, dipColor: "#0A0F1A", dipS: 0.22, lufs: -14.8, tp: -2.5, crf: 20, // loudnorm single-pass lands ~1.2 dB under its target after AAC; calibrated so the MEASURED result is ~-16 LUFS / peak <= -1.5 dB
    endHoldS: 2 };
const endcard = { kind: "endcard", title: "TradeNotes", tagline: "Know your trades. Understand your patterns. Improve your process.", small: "Not financial advice." };

const videos = [
  {
    slug: "01-win-rate-trap", format: "F1 The number lies",
    title: "A 70% win rate can still lose you money",
    ytTitle: "A 70% win rate can still lose you money",
    ytDesc: "Win rate alone can mislead. Using ten SAMPLE trades (not real trades), this short shows why expectancy and profit factor matter.",
    tiktok: "A 70% win rate can still lose you money. Ten SAMPLE trades, not real ones. I'm building TradeNotes, my own trading journal. Not financial advice.",
    tags: ["trading journal", "win rate", "expectancy", "profit factor", "trading for beginners", "risk management"],
    hashtags: ["#tradingjournal", "#tradingtips", "#learntotrade", "#forex"],
    body: {
      hook: "A seventy percent win rate can still lose you money.",
      promise: "Here is how it works, using ten sample trades.",
      beats: [
        { narration: "Seven wins of twenty dollars each. Three losses of eighty dollars each.", visual_query: "sample trades", visual_type: "scene",
          scene: { kind: "chips", items: ["win", "win", "loss", "win", "win", "loss", "win", "win", "loss", "win"].map((k) => ({ t: k === "win" ? "+$20" : "-$80", k })) } },
        { narration: "Add it up. One hundred forty dollars won, two hundred forty lost. That is minus one hundred dollars in total, or minus ten dollars per trade.", visual_query: "sum", visual_type: "scene",
          scene: { kind: "sum", won: 140, lost: 240, trades: 10 } },
        { narration: "That is why I built TradeNotes, my own trading journal. It shows your win rate next to expectancy and profit factor, so one number cannot fool you.", visual_query: "dashboard", visual_type: "scene",
          scene: { kind: "kpis", cards: [
            { label: "Win rate", value: "70%", hint: "7W / 3L." }, { label: "Net P&L", value: "-$100.00", tone: "loss", hint: "Total after fees." },
            { label: "Profit factor", value: "0.58", tone: "loss", hint: "Above 1.0 = winners outweigh losers." }, { label: "Expectancy / trade", value: "-$10.00", tone: "loss", hint: "Average result per trade." } ] } },
      ],
      cta: "Follow along while I build it. This is education, not financial advice.",
      claims: [],
      scenes: {
        hook: { kind: "kinetic", lines: [{ text: "70% WIN RATE" }, { text: "CAN STILL" }, { text: "LOSE MONEY", color: "loss" }] },
        promise: { kind: "kinetic", lines: [{ text: "10 SAMPLE", color: "amber" }, { text: "TRADES" }], sub: "Seven wins. Three losses.", badge: true },
        cta: endcard,
      },
    },
  },
  {
    slug: "02-how-many-trades", format: "F5 Beginner answers",
    title: "How many trades before you can trust your win rate",
    ytTitle: "How many trades before you can trust your win rate?",
    ytDesc: "Why a short run of results tells you very little, shown with a fair-coin simulation and SAMPLE data (not real trades).",
    tiktok: "How many trades before you can trust your win rate? A fair-coin simulation shows why short runs mislead. I'm building TradeNotes, my own trading journal. Not financial advice.",
    tags: ["trading journal", "win rate", "sample size", "trading for beginners", "trading psychology"],
    hashtags: ["#tradingjournal", "#tradingpsychology", "#learntotrade", "#forex"],
    body: {
      hook: "How many trades before you can trust your win rate?",
      promise: "The short answer is more than you think. Watch a fair coin.",
      beats: [
        { narration: "Flip a fair coin ten times and you can see seventy percent heads. Keep going to three hundred flips, and it settles near fifty.", visual_query: "coin", visual_type: "chart",
          chart: { dataset: "Fair coin flips (simulation)", kind: "line", title: "Share of heads, fair coin", unit: "%", accent: "#F2B01E", bg: "#0A0F1A" } },
        { narration: "Trading results work the same way. A hot streak of ten trades tells you very little.", visual_query: "progress", visual_type: "scene",
          scene: { kind: "progress", have: 10, need: 30, caption: "10 trades is too early to trust" } },
        { narration: "I built TradeNotes, my own trading journal. Under thirty closed trades, it warns you that results are mostly luck, so you know when to be careful.", visual_query: "dashboard", visual_type: "scene",
          scene: { kind: "kpis", note: "Based on 10 closed trades. Under 30 trades, results are mostly luck — don't draw conclusions yet.", cards: [
            { label: "Win rate", value: "70%", hint: "7W / 3L." }, { label: "Net P&L", value: "$20.00", tone: "win", hint: "Total after fees." },
            { label: "Profit factor", value: "1.17", hint: "Above 1.0 = winners outweigh losers." }, { label: "Expectancy / trade", value: "$2.00", tone: "win", hint: "Average result per trade." } ] } },
      ],
      cta: "Follow along while I build it. This is education, not financial advice.",
      claims: [],
      scenes: {
        hook: { kind: "kinetic", lines: [{ text: "HOW MANY TRADES" }, { text: "BEFORE YOU CAN" }, { text: "TRUST YOUR" }, { text: "WIN RATE?", color: "amber" }] },
        promise: { kind: "kinetic", lines: [{ text: "SHORT ANSWER:", color: "amber" }, { text: "MORE THAN" }, { text: "YOU THINK" }] },
        cta: endcard,
      },
    },
  },
];

const outRoot = path.resolve("output/tradenotes");
fs.rmSync(outRoot, { recursive: true, force: true });
const summary: any[] = [];

for (const v of videos) {
  const project = await createProject({ title: v.title, format: "short", topic: v.title, channelId: channel.id });
  const body = ScriptBody.parse(v.body);
  const script = await saveScript(project.id, body);
  const blockers = renderBlockers(script.body, script.fact_check_items, channel);
  if (blockers.length) throw new Error(`${v.slug} is blocked by the platform's own checks: ${blockers.join("; ")}`);

  const t0 = Date.now();
  const tl = await assembleProject(project.id, { style: STYLE });
  const r = await renderProject(project.id, "final");
  const dir = path.join(outRoot, v.slug); fs.mkdirSync(dir, { recursive: true });
  const mp4 = path.join(dir, `${v.slug}.mp4`);
  fs.copyFileSync(path.join(root, r.storage_key), mp4);
  for (const ext of ["srt", "vtt"]) fs.copyFileSync(path.join(root, `projects/${project.id}/captions.${ext}`), path.join(dir, `${v.slug}.${ext}`));
  await run("ffmpeg", ["-v", "error", "-y", "-ss", "1.6", "-i", mp4, "-frames:v", "1", path.join(dir, `${v.slug}-cover.png`)]);

  // ---- QA (mirrors the repo's spec) ----
  const dur = await probeDuration(mp4);
  const probe = await run("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate,codec_name", "-of", "csv=p=0", mp4]);
  const loud = await run("ffmpeg", ["-i", mp4, "-af", "ebur128=peak=true", "-f", "null", "-"]);
  const lufs = Number(loud.stderr.match(/I:\s+(-?[\d.]+) LUFS/g)!.pop()!.match(/(-?[\d.]+)/)![1]);
  const peak = Number(loud.stderr.match(/Peak:\s+(-?[\d.]+) dBFS/g)!.pop()!.match(/(-?[\d.]+)/)![1]);
  const words = body.hook.split(" ").length + body.promise.split(" ").length + body.beats.reduce((a, b) => a + b.narration.split(" ").length, 0) + body.cta.split(" ").length;
  const qa = { durationS: +dur.toFixed(1), within20to45s: dur >= 20 && dur <= 45, frame: probe.stdout.trim(), lufs, truePeakDb: peak, lufsOk: Math.abs(lufs + 16) <= 1.0, peakOk: peak <= -1.5, words };

  const disclosure = channel.disclosure.description_footer as string;
  const post = `# ${v.slug}  (${v.format})

Files: \`${v.slug}.mp4\` (1080x1920, 30 fps, captions burned in), \`${v.slug}.srt\` / \`.vtt\` (optional caption files), \`${v.slug}-cover.png\`.

## YouTube Shorts
**Title:** ${v.ytTitle}

**Description:**
${v.ytDesc}

${disclosure}
This video uses SAMPLE DATA, not real trades.

${AI_DISCLOSURE}

${DISCLAIMER}

${TRADING_RISK}

${v.hashtags.join(" ")} #shorts

**Tags:** ${v.tags.join(", ")}

## TikTok
**Caption:** ${v.tiktok} ${v.hashtags.slice(0, 3).join(" ")}

## Before you post (from your own CONTENT_ENGINE rules)
- [ ] You have approved every claim in the script (the numbers are arithmetic on sample trades; the TradeNotes features named are on the dashboard in the repo today).
- [ ] TikTok: in "Content disclosure settings" turn on commercial content disclosure -> **Your brand** (you are promoting your own app), and turn on the **AI-generated content** label (synthetic voice).
- [ ] YouTube: set audience "No, it's not made for kids"; consider turning on the altered/synthetic content disclosure for the AI voice (their rule targets realistic synthetic media, so this is the cautious choice; check the current wording).
- [ ] The call to action is "follow along" on purpose: TradeNotes is not deployed yet (IMPLEMENTATION_STATUS.md). Change it only once sign-up is live.
- [ ] Pin a comment: "Sample data, not real trades. Not financial advice."
`;
  fs.writeFileSync(path.join(dir, "POST-COPY.md"), post);
  summary.push({ video: v.slug, build: `${((Date.now() - t0) / 1000).toFixed(0)}s`, qa, segments: tl.segments.map((s) => s.visual.type) });
}
kokoroWorker.close();
console.log(JSON.stringify(summary, null, 2));
await closePool();
