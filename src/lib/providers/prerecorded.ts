import { run, probeDuration } from "../media";
import type { TTSProvider, TTSResult } from "./tts";

/**
 * Plays audio you generated elsewhere (e.g. ElevenLabs "blocks": one generation per ~15 s of narration) through the normal pipeline.
 * The pipeline asks for one voice clip per script part (hook, promise, beats, cta). Each part must be a run of whole sentences taken in order
 * from a block's text. We cut that part's audio out of the block, snapping the cut points to the pauses between sentences,
 * and estimate word timings (for captions) from character counts inside the part's real duration.
 */
export type Block = { text: string; file: string };
const norm = (s: string) => s.replace(/\s+/g, " ").trim();

export class PrerecordedTTSProvider implements TTSProvider {
  private cursor: { block: number; pos: number } = { block: 0, pos: 0 };
  private cache = new Map<string, { dur: number; env: { t: number; db: number }[] }>();
  constructor(private blocks: Block[]) {}

  /** Loudness envelope (dB RMS per 20 ms hop), used to put each cut at the quietest moment near a sentence boundary. */
  private async info(file: string) {
    let i = this.cache.get(file);
    if (!i) {
      const dur = await probeDuration(file);
      const r = await run("ffmpeg", ["-hide_banner", "-v", "error", "-i", file, "-ac", "1", "-ar", "44100", "-af", "asetnsamples=n=882:p=0,astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level:file=-", "-f", "null", "-"]);
      const env: { t: number; db: number }[] = [];
      let t = 0;
      for (const line of (r.stdout + "\n" + r.stderr).split("\n")) {
        const pt = line.match(/pts_time:([\d.]+)/); if (pt) t = +pt[1];
        const v = line.match(/RMS_level=(-?[\d.]+|-inf)/); if (v) env.push({ t, db: v[1] === "-inf" ? -120 : +v[1] });
      }
      i = { dur, env }; this.cache.set(file, i);
    }
    return i;
  }

  async synthesize(text: string, outPath: string): Promise<TTSResult> {
    const want = norm(text);
    // find this part inside the current (or a later) block, in order
    for (let b = this.cursor.block; b < this.blocks.length; b++) {
      const bt = norm(this.blocks[b].text);
      const from = b === this.cursor.block ? this.cursor.pos : 0;
      const at = bt.indexOf(want, from);
      if (at < 0) continue;
      const { dur, env } = await this.info(this.blocks[b].file);
      // weight each character; sentence ends and commas carry a pause
      const weight = (s: string) => [...s].reduce((a, ch) => a + (/[.?!]/.test(ch) ? 4 : /[,:]/.test(ch) ? 2 : 1), 0);
      const total = weight(bt);
      const tStart = (weight(bt.slice(0, at)) / total) * dur, tEnd = (weight(bt.slice(0, at + want.length)) / total) * dur;
      // move a cut to the quietest ~60 ms (smoothed) within +-0.5 s of the estimate; sentence boundaries are where speakers pause
      const snap = (t: number) => {
        const w = env.filter((x) => Math.abs(x.t - t) <= 0.5);
        if (w.length < 5) return t;
        let best = w[0].t, bestDb = Infinity;
        for (let k = 1; k < w.length - 1; k++) { const db = (w[k - 1].db + w[k].db + w[k + 1].db) / 3; if (db < bestDb) { bestDb = db; best = w[k].t; } }
        return best;
      };
      const s = at === 0 ? 0 : snap(tStart);
      const e = at + want.length >= bt.length ? dur : snap(tEnd);
      await run("ffmpeg", ["-y", "-v", "error", "-ss", s.toFixed(3), "-to", e.toFixed(3), "-i", this.blocks[b].file, "-ar", "44100", "-ac", "2", "-af", `afade=t=in:d=0.012,afade=t=out:st=${Math.max(0, e - s - 0.012).toFixed(3)}:d=0.012`, outPath]); // tiny fades: no clicks at the cuts
      const d = await probeDuration(outPath);
      const tokens = want.split(/\s+/);
      const ws = tokens.map((w) => weight(w) + 1), sum = ws.reduce((a, c) => a + c, 0);
      let acc = 0;
      const words = tokens.map((w, k) => { const st = (acc / sum) * d; acc += ws[k]; return { w, start: +st.toFixed(3), end: +Math.max(st + 0.05, (acc / sum) * d - 0.02).toFixed(3) }; });
      this.cursor = { block: b, pos: at + want.length };
      return { audioPath: outPath, durationS: d, words, chars: 0, costUsd: 0, provider: "prerecorded" };
    }
    throw new Error(`prerecorded audio: could not find this script part in the blocks (or it is out of order): "${want.slice(0, 60)}"`);
  }
}
