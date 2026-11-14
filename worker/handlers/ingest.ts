import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getPool } from "../../src/lib/db";
import { getStorage } from "../../src/lib/storage";
import { canDownload, type Rights } from "../../src/lib/rights";
import { downloadSource } from "../../src/lib/download";
import { normalizeVideo, extractAudio, probeDuration, run } from "../../src/lib/media";
import { getTranscriptProvider, type TranscriptProvider } from "../../src/lib/providers/transcript";
import { logCost, type Job } from "../../src/lib/queue";

export async function ingestSource(job: Job, provider: TranscriptProvider = getTranscriptProvider()) {
  const db = getPool();
  const id: string = job.payload.sourceId;
  const { rows } = await db.query("select * from sources where id=$1", [id]);
  const src = rows[0];
  if (!src) throw new Error("source not found");
  const rights = src.rights_status as Rights;
  if (rights === "unknown") throw new Error("refusing to ingest source with unknown rights");

  // Rights gate: do not copy media we have no license to hold.
  if (src.type === "link" && !canDownload(rights)) {
    await db.query("update sources set status='reference_only' where id=$1", [id]);
    return { referenceOnly: true };
  }

  await db.query("update sources set status='ingesting', error=null where id=$1", [id]);
  const storage = getStorage();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "vibloid-"));
  try {
    let raw: string;
    if (src.type === "link") {
      raw = path.join(tmp, "raw.mp4");
      await downloadSource(src.url, raw);
    } else {
      raw = storage.localPath(src.storage_key);
    }
    const normKey = `sources/${id}/normalized.mp4`;
    const norm = storage.localPath(normKey);
    await normalizeVideo(raw, norm);
    const wav = path.join(tmp, "audio.wav");
    await extractAudio(norm, wav);
    // Waveform strip for the clip trimmer UI (best effort; the UI works without it).
    await run("ffmpeg", ["-y", "-i", wav, "-filter_complex", "showwavespic=s=1600x180:colors=0xf5c542", "-frames:v", "1", storage.localPath(`sources/${id}/waveform.png`)]).catch(() => {});
    const dur = await probeDuration(norm);
    const t = await provider.transcribe(wav, dur);
    await db.query(
      `insert into transcripts (source_id, text, words, provider) values ($1,$2,$3,$4)
       on conflict (source_id) do update set text=excluded.text, words=excluded.words, provider=excluded.provider`,
      [id, t.text, JSON.stringify(t.words), t.provider],
    );
    await logCost({ jobId: job.id, provider: t.provider, unit: "audio_seconds", quantity: dur, costUsd: t.costUsd });
    await db.query("update sources set status='ready', storage_key=$2, duration_s=$3 where id=$1", [id, normKey, dur]);
    return { duration: dur, words: t.words.length };
  } catch (e) {
    await db.query("update sources set status='failed', error=$2 where id=$1", [id, String((e as Error).message).slice(0, 500)]);
    throw e;
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}
