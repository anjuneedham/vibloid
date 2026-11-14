/**
 * Produces one complete test Short (voice + captions + animated charts + render) in a throwaway database.
 * Usage: TTS_PROVIDER=kokoro VIDEO_PROVIDER=mock pnpm exec tsx scripts/make-test-video.ts
 * Uses NO language-model API: the script below is hand-written. Chart data is a clearly-labelled hypothetical plus plain arithmetic.
 */
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const ADMIN = process.env.E2E_ADMIN_URL ?? "postgres://postgres@localhost:5433/postgres";
const DB = "vibloid_demo";
process.env.DATABASE_URL = ADMIN.replace(/\/[^/]*$/, `/${DB}`);

const { getPool, closePool } = await import("../src/lib/db");
const { migrate } = await import("./migrate");
const { setStorage, LocalStorage } = await import("../src/lib/storage");
const { createChannel } = await import("../src/lib/channels");
const { createDataset } = await import("../src/lib/datasets");
const { createProject, saveScript, ScriptBody, renderBlockers } = await import("../src/lib/scripts");
const { assembleProject } = await import("../src/lib/assemble");
const { renderProject } = await import("../src/lib/render");
const { kokoroWorker } = await import("../src/lib/providers/tts");
const { run } = await import("../src/lib/media");

const admin = new pg.Client({ connectionString: ADMIN }); await admin.connect();
await admin.query(`drop database if exists ${DB} with (force)`); await admin.query(`create database ${DB}`); await admin.end();
await migrate();

const root = path.resolve("storage/demo");
fs.rmSync(root, { recursive: true, force: true });
setStorage(new LocalStorage(root));

const channel = await createChannel({ name: "Chart School (test)", kind: "attention", niche: "trading", brand: { font: "Inter", accent: "#f5c542" } });

// Hypothetical OHLC path: climbs to 338 then falls to 222 (-34.3%). Labelled as hypothetical on screen.
const closes = [300, 308, 315, 326, 338, 331, 318, 301, 284, 262, 240, 222];
const points = closes.map((c, i) => {
  const o = i ? closes[i - 1] : 296, wiggle = 4 + (i % 3) * 2;
  return { t: `Day ${i + 1}`, o, h: Math.max(o, c) + wiggle, l: Math.min(o, c) - wiggle, c };
});
await createDataset({ name: "Hypothetical price path", kind: "ohlc", points, source: "Hypothetical example, not real prices", notes: "Made up for teaching" });
// Pure arithmetic: gain needed to get back to even after a loss L is L / (1 - L).
const losses = [10, 20, 30, 40, 50];
await createDataset({ name: "Gain needed to recover", kind: "series", source: "Calculation: gain = loss / (1 - loss)",
  points: losses.map((L) => ({ t: `${L}% loss`, v: +((L / (100 - L)) * 100).toFixed(1) })) });

const project = await createProject({ title: "What a drawdown really is", format: "short", topic: "drawdowns", channelId: channel.id });
const body = ScriptBody.parse({
  hook: "Most beginners misread this one chart.",
  promise: "In forty five seconds you will see what a drawdown really is, and why it matters more than your wins.",
  beats: [
    { narration: "A drawdown is how far a price falls from its highest point to its lowest point after that.", visual_query: "stock ticker screen", visual_type: "stock_video", on_screen_text: "WHAT IS A DRAWDOWN?" },
    { narration: "Say a hypothetical stock climbs to three hundred thirty eight, then drops to two hundred twenty two. That is a drawdown of roughly thirty four percent.", visual_query: "chart", visual_type: "chart",
      chart: { dataset: "Hypothetical price path", kind: "candles", title: "A hypothetical 34% drawdown" }, on_screen_text: "-34%" },
    { narration: "Here is the catch. To get back to even after a loss like that, you need a gain of about fifty two percent.", visual_query: "chart", visual_type: "chart",
      chart: { dataset: "Gain needed to recover", kind: "bars", title: "Gain needed to get back to even" }, on_screen_text: "+52% TO RECOVER" },
    { narration: "That is why careful traders think about limiting losses before they chase profits. Trading carries real risk of loss, and this video is education, not advice.", visual_query: "city skyline night", visual_type: "stock_video", on_screen_text: "PROTECT CAPITAL FIRST" },
  ],
  cta: "Follow for more market lessons explained simply.", claims: [],
});
const script = await saveScript(project.id, body);
const blockers = renderBlockers(script.body, script.fact_check_items, channel);
if (blockers.length) throw new Error("script is blocked: " + blockers.join("; "));

const t0 = Date.now();
const tl = await assembleProject(project.id);
const tAssemble = (Date.now() - t0) / 1000;
const t1 = Date.now();
const r = await renderProject(project.id, "final");
const tRender = (Date.now() - t1) / 1000;
kokoroWorker.close();

const out = path.resolve("output"); fs.mkdirSync(out, { recursive: true });
const dest = path.join(out, "test-video.mp4");
fs.copyFileSync(path.join(root, r.storage_key), dest);
const loud = await run("ffmpeg", ["-i", dest, "-af", "ebur128=peak=true", "-f", "null", "-"]);
const lufs = loud.stderr.match(/I:\s+(-?[\d.]+) LUFS/g)?.pop();
console.log(JSON.stringify({ file: dest, durationS: Number(r.duration_s), sizeMB: +(Number(r.size_bytes) / 1e6).toFixed(2), segments: tl.segments.map((s) => s.visual.type), assembleSeconds: +tAssemble.toFixed(1), renderSeconds: +tRender.toFixed(1), loudness: lufs }, null, 2));
await closePool();
