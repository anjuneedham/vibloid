import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getPool } from "./db";
import { getStorage } from "./storage";
import { assertProjectRenderable } from "./gates";
import { getTTSProvider, assertVoiceCredits, type TTSProvider } from "./providers/tts";
import { getImageProvider, type ImageProvider } from "./providers/images";
import { buildAss, hexToAss, buildSrt, buildVtt } from "./captions";
import { DIMS, type Segment, type Timeline } from "./timeline";
import { logCost } from "./queue";
import { getVideoProvider, type VideoProvider } from "./providers/videos";
import { getAIImageProvider, aiImageCostUsd } from "./providers/images";
import { getDatasetByName } from "./datasets";
import { renderChartVideo } from "./charts";
import { renderSceneVideo, type Scene } from "./scenes";
import { assertProjectBudget } from "./budget";
import { run } from "./media";
import type { Word } from "./providers/transcript";

const GAP = 0.15;

async function ensureMusic(projectId: string) {
  const dir = process.env.MUSIC_DIR;
  if (dir && fs.existsSync(dir)) {
    const f = fs.readdirSync(dir).find((x) => /\.(mp3|wav|m4a)$/i.test(x));
    const lic = f && fs.existsSync(path.join(dir, f + ".license.json")) ? JSON.parse(fs.readFileSync(path.join(dir, f + ".license.json"), "utf8")) : null;
    if (f && lic) { const key = `projects/${projectId}/music${path.extname(f)}`; await getStorage().putFile(key, path.join(dir, f)); return { key, license: lic }; }
  }
  // No licensed track supplied: synthesize a quiet ambient pad (our own, CC0).
  const key = `projects/${projectId}/music.wav`;
  await run("ffmpeg", ["-y", "-f", "lavfi", "-i", "sine=frequency=110:duration=600:sample_rate=44100", "-f", "lavfi", "-i", "sine=frequency=165:duration=600:sample_rate=44100",
    "-filter_complex", "[0][1]amix=inputs=2,volume=0.25,lowpass=f=600", "-ac", "2", getStorage().localPath(key)]);
  return { key, license: { source: "generated", license: "CC0 (generated ambient pad)" } };
}

export async function assembleProject(projectId: string, o: { tts?: TTSProvider; images?: ImageProvider; videos?: VideoProvider | null; aiImages?: ImageProvider; jobId?: string; style?: Timeline["style"] } = {}): Promise<Timeline> {
  const { project, script } = await assertProjectRenderable(projectId);
  const db = getPool(), storage = getStorage();
  const tts = o.tts ?? getTTSProvider(), images = o.images ?? getImageProvider();
  const videos = o.videos === undefined ? getVideoProvider() : o.videos;
  const aiImages = o.aiImages ?? getAIImageProvider();
  const aiMax = Number(process.env.AI_MAX_PER_VIDEO ?? 2);
  let aiUsed = 0;
  const { width, height } = DIMS[project.format as "short" | "long"];
  const orientation = height > width ? "portrait" : "landscape";
  const b = script.body;
  const parts: { kind: Segment["kind"]; text: string; query: string; on?: string; clipRef?: string; beat?: any; scene?: Scene }[] = [
    { kind: "hook", text: b.hook, query: b.beats[0]?.visual_query ?? "money", scene: b.scenes?.hook as Scene | undefined },
    { kind: "promise", text: b.promise, query: b.beats[0]?.visual_query ?? "money", scene: b.scenes?.promise as Scene | undefined },
    ...b.beats.map((x: any) => ({ kind: "beat" as const, text: x.narration, query: x.visual_query, on: x.on_screen_text, clipRef: x.clip_ref, beat: x, scene: x.visual_type === "scene" ? (x.scene as Scene) : undefined })),
    { kind: "cta", text: b.cta, query: "city skyline sunrise", scene: b.scenes?.cta as Scene | undefined },
  ];
  assertVoiceCredits(parts.map((x) => x.text), process.env.TTS_PROVIDER ?? "mock"); // stop before spending credits
  await db.query("delete from assets where project_id=$1 and kind in ('audio','image','video','caption','timeline','music')", [projectId]);

  const segments: Segment[] = [];
  const allWords: Word[] = [];
  let t = 0;
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    const voiceKey = `projects/${projectId}/seg${i}.wav`;
    const v = await tts.synthesize(p.text, storage.localPath(voiceKey));
    await logCost({ jobId: o.jobId, projectId, provider: v.provider, unit: "chars", quantity: v.chars, costUsd: v.costUsd });
    await db.query("insert into assets (project_id,kind,storage_key,meta) values ($1,'audio',$2,$3)", [projectId, voiceKey, JSON.stringify({ segment: i, duration: v.durationS, provider: v.provider })]);
    v.words.forEach((w) => allWords.push({ w: w.w, start: +(w.start + t).toFixed(3), end: +(w.end + t).toFixed(3) }));

    let visual: Segment["visual"];
    const clip = p.clipRef ? (await db.query("select c.*, s.storage_key, s.id as sid from clips c join sources s on s.id=c.source_id where c.id=$1", [p.clipRef])).rows[0] : null;
    if (clip?.storage_key) {
      const dur = Math.min(v.durationS, Number(clip.end_s) - Number(clip.start_s));
      visual = { type: "clip", key: clip.storage_key, sourceId: clip.sid, clip: { start: Number(clip.start_s), end: Number(clip.start_s) + dur } };
    } else {
      const want: string = p.beat?.visual_type ?? (videos ? "stock_video" : "image");
      const segDur = v.durationS + GAP;
      let chosen: Segment["visual"] | null = null;

      if (p.scene) {
        // Fully animated, code-drawn scene: no footage, no license to track.
        const key = `projects/${projectId}/scene${i}.mp4`;
        const hold = i === parts.length - 1 ? o.style?.endHoldS ?? 0 : 0;
        await renderSceneVideo({ scene: p.scene, width, height, durationS: segDur + hold, outPath: storage.localPath(key) });
        const lic = { source: "own-render", license: "Animated in-app (code-drawn)" };
        await db.query("insert into assets (project_id,kind,storage_key,license,meta) values ($1,'video',$2,$3,$4)", [projectId, key, JSON.stringify(lic), JSON.stringify({ scene: p.scene.kind })]);
        chosen = { type: "scene", key, license: lic };
      } else if (want === "chart" && p.beat?.chart) {
        // Charts render only from real, sourced datasets. A missing dataset blocks the render rather than inventing numbers.
        const ds = await getDatasetByName(p.beat.chart.dataset);
        if (!ds) throw new Error(`render blocked: chart dataset "${p.beat.chart.dataset}" does not exist; add it with its source first`);
        const key = `projects/${projectId}/chart${i}.mp4`;
        await renderChartVideo({ ds, spec: { kind: p.beat.chart.kind ?? "line", title: p.beat.chart.title, unit: p.beat.chart.unit, accent: p.beat.chart.accent, bg: p.beat.chart.bg, hidePct: !!p.beat.chart.unit }, width, height, durationS: segDur, outPath: storage.localPath(key) });
        await db.query("insert into assets (project_id,kind,storage_key,license,meta) values ($1,'video',$2,$3,$4)", [projectId, key, JSON.stringify({ source: "own-render", license: `Chart of ${ds.source}` }), JSON.stringify({ chart: true, dataset: ds.name, source: ds.source, as_of: ds.as_of })]);
        chosen = { type: "chart", key, license: { source: "own-render", license: `Chart of ${ds.source}` } };
      } else if ((want === "ai_image" || want === "ai_clip") && aiUsed < aiMax) {
        const est = aiImageCostUsd();
        await assertProjectBudget(projectId, est); // hard stop before paying for an AI image
        const key = `projects/${projectId}/ai${i}.png`;
        const r = await aiImages.fetch(p.beat?.ai_prompt ?? p.query, storage.localPath(key), { orientation });
        aiUsed++;
        await logCost({ jobId: o.jobId, projectId, provider: r.license.source, unit: "images", quantity: 1, costUsd: r.costUsd ?? 0 });
        await db.query("insert into assets (project_id,kind,storage_key,license,meta) values ($1,'image',$2,$3,$4)", [projectId, key, JSON.stringify(r.license), JSON.stringify({ ai: true, prompt: p.beat?.ai_prompt ?? p.query })]);
        chosen = { type: "ai_image", key, license: r.license };
      } else if ((want === "stock_video" || want === "ai_image" || want === "ai_clip" || want === "chart") && videos) {
        try {
          const key = `projects/${projectId}/vid${i}.mp4`;
          const r = await videos.fetch(p.query, storage.localPath(key), { orientation, minSeconds: segDur });
          await db.query("insert into assets (project_id,kind,storage_key,license,meta) values ($1,'video',$2,$3,$4)", [projectId, key, JSON.stringify(r.license), JSON.stringify({ query: p.query, duration: r.durationS })]);
          chosen = { type: "video", key, license: r.license };
        } catch { /* no footage for this query: fall back to a still */ }
      }
      if (!chosen) {
        const imgKey = `projects/${projectId}/img${i}.png`;
        const r = await images.fetch(p.query, storage.localPath(imgKey), { orientation });
        await db.query("insert into assets (project_id,kind,storage_key,license,meta) values ($1,'image',$2,$3,$4)", [projectId, imgKey, JSON.stringify(r.license), JSON.stringify({ query: p.query })]);
        chosen = { type: "image", key: imgKey, license: r.license };
      }
      visual = chosen;
    }
    segments.push({ id: `s${i}`, kind: p.kind, text: p.text, start: +t.toFixed(3), end: +(t + v.durationS).toFixed(3), voiceKey, visual, onScreenText: p.on });
    t += v.durationS + GAP;
  }

  const hold = o.style?.endHoldS ?? 0;
  const brand = (await db.query("select brand from channels where id = $1 or ($1 is null and true) order by created_at limit 1", [project.channel_id ?? null])).rows[0]?.brand ?? {};
  const capKey = `projects/${projectId}/captions.ass`;
  await storage.putFile(capKey, Buffer.from(buildAss(allWords, { width, height, preset: o.style?.captions, font: o.style?.captions ? undefined : brand.font, highlight: o.style?.highlight ? hexToAss(o.style.highlight) : brand.accent && !o.style?.captions ? hexToAss(brand.accent) : undefined, overlays: segments.filter((x) => x.onScreenText).map((x) => ({ text: x.onScreenText!, start: x.start, end: x.end })) })));
  await db.query("insert into assets (project_id,kind,storage_key,meta) values ($1,'caption',$2,$3)", [projectId, capKey, JSON.stringify({ words: allWords.length })]);
  // Plain-text caption files for platforms that accept uploads (YouTube: Subtitles). TikTok uses the burned-in captions.
  for (const [ext, content] of [["srt", buildSrt(allWords)], ["vtt", buildVtt(allWords)]] as const) {
    const k = `projects/${projectId}/captions.${ext}`;
    await storage.putFile(k, Buffer.from(content));
    await db.query("insert into assets (project_id,kind,storage_key,meta) values ($1,'caption',$2,$3)", [projectId, k, JSON.stringify({ format: ext })]);
  }
  const music = await ensureMusic(projectId);
  await db.query("insert into assets (project_id,kind,storage_key,license) values ($1,'music',$2,$3)", [projectId, music.key, JSON.stringify(music.license)]);

  const timeline: Timeline = { version: 1, projectId, format: project.format, width, height, fps: 30, duration: +(t - GAP + hold).toFixed(3), segments, captionsKey: capKey, music: { ...music, volume: 0.12 }, ...(o.style ? { style: o.style } : {}) };
  const tlKey = `projects/${projectId}/timeline.json`;
  await storage.putFile(tlKey, Buffer.from(JSON.stringify(timeline, null, 2)));
  await db.query("insert into assets (project_id,kind,storage_key,meta) values ($1,'timeline',$2,$3)", [projectId, tlKey, JSON.stringify({ duration: timeline.duration })]);
  await db.query("update projects set status='assembled' where id=$1", [projectId]);
  return timeline;
}
