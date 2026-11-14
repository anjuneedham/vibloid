import crypto from "node:crypto";
import fs from "node:fs";
import { getPool } from "./db";
import { getStorage } from "./storage";
import { assertProjectRenderable } from "./gates";
import { run, probeDuration } from "./media";
import type { Timeline, Segment } from "./timeline";

const GAP = 0.15;
const sha = (b: Buffer | string) => crypto.createHash("sha256").update(b).digest("hex");
const fileSha = (p: string) => sha(fs.readFileSync(p));

export type RenderKind = "preview" | "final";
const BITEXACT = ["-fflags", "+bitexact", "-flags:v", "+bitexact", "-flags:a", "+bitexact", "-map_metadata", "-1", "-threads", "2"];

/** Reframe (center-crop) to target size. Subject/face tracking is a future upgrade. */
const fit = (w: number, h: number) => `scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},setsar=1`;

async function renderSegment(seg: Segment, dur: number, w: number, h: number, fps: number, out: string, preview: boolean, style?: Timeline["style"]) {
  const storage = getStorage();
  // Quick "dip" transition: each scene fades from/to the channel's background color (spec: 0.22 s total at every cut).
  const d = style?.dipS ? style.dipS / 2 : 0;
  const dc = (style?.dipColor ?? "#0A0F1A").replace("#", "0x");
  const dip = d ? `,fade=t=in:st=0:d=${d}:color=${dc},fade=t=out:st=${Math.max(0, dur - d).toFixed(3)}:d=${d}:color=${dc}` : "";
  const frames = Math.max(2, Math.round(dur * fps));
  const enc = ["-an", "-c:v", "libx264", "-preset", preview ? "ultrafast" : "veryfast", "-crf", preview ? "30" : String(style?.crf ?? 21), "-pix_fmt", "yuv420p", "-r", String(fps), ...BITEXACT];
  if (seg.visual.type === "video" || seg.visual.type === "chart" || seg.visual.type === "scene") {
    // Stock video / chart animation: loop if shorter than the beat, then trim, reframe to the target size.
    await run("ffmpeg", ["-y", "-stream_loop", "-1", "-i", storage.localPath(seg.visual.key), "-t", dur.toFixed(3), "-vf", `${fit(w, h)},fps=${fps}${dip}`, ...enc, out]);
  } else if (seg.visual.type === "ai_image") {
    // AI still brought to life: stronger push-in plus a slow sideways drift (parallax feel).
    const zp = `zoompan=z='min(1.0+0.0016*on,1.32)':x='(iw-iw/zoom)*on/${frames}':y='ih/2-(ih/zoom/2)':d=${frames}:s=${w}x${h}:fps=${fps}`;
    await run("ffmpeg", ["-y", "-loop", "1", "-i", storage.localPath(seg.visual.key), "-vf", `${fit(w * 2, h * 2)},${zp}${dip}`, "-frames:v", String(frames), ...enc, out]);
  } else if (seg.visual.type === "clip") {
    const c = seg.visual.clip!;
    await run("ffmpeg", ["-y", "-ss", String(c.start), "-i", storage.localPath(seg.visual.key), "-t", dur.toFixed(3), "-vf", `${fit(w, h)},fps=${fps},tpad=stop_mode=clone:stop_duration=${dur.toFixed(2)}${dip}`, "-t", dur.toFixed(3), ...enc, out]);
  } else {
    // Ken Burns: slow zoom-in on a 2x supersampled still to avoid jitter.
    const zp = `zoompan=z='min(1.0+0.0007*on,1.15)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${w}x${h}:fps=${fps}`;
    await run("ffmpeg", ["-y", "-loop", "1", "-i", storage.localPath(seg.visual.key), "-vf", `${fit(w * 2, h * 2)},${zp}${dip}`, "-frames:v", String(frames), ...enc, out]);
  }
}

export async function renderProject(projectId: string, kind: RenderKind = "final", opts: { force?: boolean } = {}) {
  await assertProjectRenderable(projectId);
  const db = getPool(), storage = getStorage();
  const tlRow = (await db.query("select storage_key from assets where project_id=$1 and kind='timeline' order by created_at desc limit 1", [projectId])).rows[0];
  if (!tlRow) throw new Error("no timeline: run assemble first");
  const tlJson = fs.readFileSync(storage.localPath(tlRow.storage_key), "utf8");
  const tl: Timeline = JSON.parse(tlJson);
  const preview = kind === "preview";
  const k = preview ? 0.5 : 1;
  const W = Math.round(tl.width * k / 2) * 2, H = Math.round(tl.height * k / 2) * 2;

  // Idempotency: same timeline + same asset bytes + same settings => same render.
  const assetHashes = [...tl.segments.flatMap((s) => [s.voiceKey, s.visual.key]), tl.music.key, tl.captionsKey].map((key) => fileSha(storage.localPath(key)));
  const inputHash = sha(JSON.stringify({ tlJson, assetHashes, kind, v: 2 }));
  const existing = (await db.query("select * from renders where project_id=$1 and kind=$2 and input_hash=$3 order by created_at desc limit 1", [projectId, kind, inputHash])).rows[0];
  if (existing && !opts.force && fs.existsSync(storage.localPath(existing.storage_key))) return { ...existing, reused: true };

  const dir = `projects/${projectId}/render-${kind}`;
  const segFiles: string[] = [];
  for (let i = 0; i < tl.segments.length; i++) {
    const seg = tl.segments[i];
    const next = tl.segments[i + 1];
    const dur = (next ? next.start : seg.end) - seg.start + (next ? 0 : tl.style?.endHoldS ?? 0); // last scene lingers (end card)
    // Resumable: segment cache keyed by its own inputs; a retry skips finished segments.
    const segKey = `${dir}/v-${sha(JSON.stringify([seg.visual, dur.toFixed(3), W, H, tl.fps, tl.style?.dipS, tl.style?.dipColor, tl.style?.crf])).slice(0, 16)}-${fileSha(storage.localPath(seg.visual.key)).slice(0, 8)}.mp4`;
    const p = storage.localPath(segKey);
    if (!fs.existsSync(p)) {
      const tmp = p + ".part.mp4";
      await renderSegment(seg, dur, W, H, tl.fps, tmp, preview, tl.style);
      fs.renameSync(tmp, p);
    }
    segFiles.push(p);
  }
  const listPath = storage.localPath(`${dir}/concat.txt`);
  fs.writeFileSync(listPath, segFiles.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join("\n"));

  // Audio inputs: N voice segments delayed to their start times, plus looped music ducked under the voice.
  const inputs: string[] = ["-f", "concat", "-safe", "0", "-i", listPath];
  tl.segments.forEach((s) => inputs.push("-i", storage.localPath(s.voiceKey)));
  inputs.push("-stream_loop", "-1", "-i", storage.localPath(tl.music.key));
  const n = tl.segments.length;
  const delays = tl.segments.map((s, i) => `[${i + 1}:a]adelay=${Math.round(s.start * 1000)}|${Math.round(s.start * 1000)},aresample=44100[a${i}]`).join(";");
  const voiceMix = `${tl.segments.map((_, i) => `[a${i}]`).join("")}amix=inputs=${n}:normalize=0:dropout_transition=0,asplit=2[voice][vkey]`;
  const music = `[${n + 1}:a]volume=${tl.music.volume},aresample=44100[m];[m][vkey]sidechaincompress=threshold=0.04:ratio=10:attack=20:release=400[duck]`;
  const final = `[voice][duck]amix=inputs=2:normalize=0,loudnorm=I=${tl.style?.lufs ?? -14}:TP=${tl.style?.tp ?? -1.5}:LRA=11[aout]`;
  const ass = storage.localPath(tl.captionsKey).replace(/\\/g, "/").replace(/:/g, "\\:").replace(/'/g, "\\'");
  const fontsdir = fs.existsSync("/usr/share/fonts") ? ":fontsdir=/usr/share/fonts" : "";
  const filter = `${delays};${voiceMix};${music};${final};[0:v]ass='${ass}'${fontsdir}[vout]`;

  const outKey = `projects/${projectId}/${kind}-${inputHash.slice(0, 12)}.mp4`;
  const outPath = storage.localPath(outKey);
  await run("ffmpeg", ["-y", ...inputs, "-filter_complex", filter, "-map", "[vout]", "-map", "[aout]", "-t", tl.duration.toFixed(3),
    "-c:v", "libx264", "-preset", preview ? "ultrafast" : "veryfast", "-crf", preview ? "30" : String(tl.style?.crf ?? 21), "-pix_fmt", "yuv420p", "-r", String(tl.fps),
    "-c:a", "aac", "-b:a", "160k", "-ar", "44100", "-movflags", "+faststart", ...BITEXACT, outPath]);

  const dur = await probeDuration(outPath);
  const r = await db.query(
    `insert into renders (project_id,kind,storage_key,output_hash,duration_s,size_bytes,input_hash) values ($1,$2,$3,$4,$5,$6,$7) returning *`,
    [projectId, kind, outKey, fileSha(outPath), dur, fs.statSync(outPath).size, inputHash],
  );
  if (!preview) await db.query("update projects set status='rendered' where id=$1 and status in ('assembled','rendered')", [projectId]);
  return { ...r.rows[0], reused: false };
}
