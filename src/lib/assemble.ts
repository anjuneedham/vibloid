import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getPool } from "./db";
import { getStorage } from "./storage";
import { assertProjectRenderable } from "./gates";
import { getTTSProvider, type TTSProvider } from "./providers/tts";
import { getImageProvider, type ImageProvider } from "./providers/images";
import { buildAss } from "./captions";
import { DIMS, type Segment, type Timeline } from "./timeline";
import { logCost } from "./queue";
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

export async function assembleProject(projectId: string, o: { tts?: TTSProvider; images?: ImageProvider; jobId?: string } = {}): Promise<Timeline> {
  const { project, script } = await assertProjectRenderable(projectId);
  const db = getPool(), storage = getStorage();
  const tts = o.tts ?? getTTSProvider(), images = o.images ?? getImageProvider();
  const { width, height } = DIMS[project.format as "short" | "long"];
  const orientation = height > width ? "portrait" : "landscape";
  const b = script.body;
  const parts: { kind: Segment["kind"]; text: string; query: string; on?: string; clipRef?: string }[] = [
    { kind: "hook", text: b.hook, query: b.beats[0]?.visual_query ?? "money" },
    { kind: "promise", text: b.promise, query: b.beats[0]?.visual_query ?? "money" },
    ...b.beats.map((x: any) => ({ kind: "beat" as const, text: x.narration, query: x.visual_query, on: x.on_screen_text, clipRef: x.clip_ref })),
    { kind: "cta", text: b.cta, query: "city skyline sunrise" },
  ];
  await db.query("delete from assets where project_id=$1 and kind in ('audio','image','caption','timeline','music')", [projectId]);

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
      const imgKey = `projects/${projectId}/img${i}.png`;
      const r = await images.fetch(p.query, storage.localPath(imgKey), { orientation });
      await db.query("insert into assets (project_id,kind,storage_key,license,meta) values ($1,'image',$2,$3,$4)", [projectId, imgKey, JSON.stringify(r.license), JSON.stringify({ query: p.query })]);
      visual = { type: "image", key: imgKey, license: r.license };
    }
    segments.push({ id: `s${i}`, kind: p.kind, text: p.text, start: +t.toFixed(3), end: +(t + v.durationS).toFixed(3), voiceKey, visual, onScreenText: p.on });
    t += v.durationS + GAP;
  }

  const capKey = `projects/${projectId}/captions.ass`;
  await storage.putFile(capKey, Buffer.from(buildAss(allWords, { width, height, overlays: segments.filter((x) => x.onScreenText).map((x) => ({ text: x.onScreenText!, start: x.start, end: x.end })) })));
  await db.query("insert into assets (project_id,kind,storage_key,meta) values ($1,'caption',$2,$3)", [projectId, capKey, JSON.stringify({ words: allWords.length })]);
  const music = await ensureMusic(projectId);
  await db.query("insert into assets (project_id,kind,storage_key,license) values ($1,'music',$2,$3)", [projectId, music.key, JSON.stringify(music.license)]);

  const timeline: Timeline = { version: 1, projectId, format: project.format, width, height, fps: 30, duration: +(t - GAP).toFixed(3), segments, captionsKey: capKey, music: { ...music, volume: 0.12 } };
  const tlKey = `projects/${projectId}/timeline.json`;
  await storage.putFile(tlKey, Buffer.from(JSON.stringify(timeline, null, 2)));
  await db.query("insert into assets (project_id,kind,storage_key,meta) values ($1,'timeline',$2,$3)", [projectId, tlKey, JSON.stringify({ duration: timeline.duration })]);
  await db.query("update projects set status='assembled' where id=$1", [projectId]);
  return timeline;
}
