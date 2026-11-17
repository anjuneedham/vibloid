import fs from "node:fs";
import { spawn, type ChildProcess } from "node:child_process";
import crypto from "node:crypto";
import os from "node:os";
import path from "node:path";
import { run, probeDuration } from "../media";
import { OpenAITranscriptProvider } from "./transcript";
import type { Word } from "./transcript";
import { httpError, wrapProvider } from "../resilience";

export type TTSResult = { audioPath: string; durationS: number; words: Word[]; costUsd: number; provider: string; chars: number; credits?: number };
export interface TTSProvider {
  synthesize(text: string, outPath: string, opts?: { voice?: string }): Promise<TTSResult>;
}

const WPS = 2.6; // spoken words per second for the mock

/** Offline stand-in: soft pink noise of plausible duration with evenly spaced word timings. */
export class MockTTSProvider implements TTSProvider {
  async synthesize(text: string, outPath: string): Promise<TTSResult> {
    const tokens = text.split(/\s+/).filter(Boolean);
    const dur = Math.max(1, tokens.length / WPS);
    await run("ffmpeg", ["-y", "-f", "lavfi", "-i", `anoisesrc=d=${dur.toFixed(3)}:c=pink:a=0.03:r=44100`, "-ac", "2", outPath]);
    const per = dur / tokens.length;
    return { audioPath: outPath, durationS: dur, chars: text.length, costUsd: 0, provider: "mock",
      words: tokens.map((w, i) => ({ w, start: +(i * per).toFixed(3), end: +((i + 1) * per - 0.02).toFixed(3) })) };
  }
}

/** Convert ElevenLabs character alignment into word timings. */
export function charsToWords(chars: string[], starts: number[], ends: number[]): Word[] {
  const words: Word[] = [];
  let cur = "", s = 0, e = 0;
  chars.forEach((c, i) => {
    if (/\s/.test(c)) { if (cur) { words.push({ w: cur, start: s, end: e }); cur = ""; } return; }
    if (!cur) s = starts[i];
    cur += c; e = ends[i];
  });
  if (cur) words.push({ w: cur, start: s, end: e });
  return words;
}

/** Default to a cheap model: Flash v2.5 bills 0.5 credit per character (about 4,500 credits for 10 minutes of narration). */
export const ELEVENLABS_DEFAULT_MODEL = "eleven_flash_v2_5";
export const elevenModel = () => process.env.ELEVENLABS_MODEL ?? ELEVENLABS_DEFAULT_MODEL;
/** Credits per character: Flash/Turbo models are half price, Multilingual v2/v3 are 1 per character. */
export const creditsPerChar = (model = elevenModel()) => (/flash|turbo/i.test(model) ? 0.5 : 1);
export const estimateCredits = (chars: number, model = elevenModel()) => Math.ceil(chars * creditsPerChar(model));
export const maxCreditsPerVideo = () => Number(process.env.ELEVENLABS_MAX_CREDITS_PER_VIDEO ?? 4500);
/** Character budget for one video's narration under the credit cap (4,500 credits on Flash = 9,000 characters). */
export const maxNarrationChars = () => Math.floor(maxCreditsPerVideo() / creditsPerChar());

/** Throws before any audio is generated if the narration would spend more credits than the per-video cap. */
export function assertVoiceCredits(texts: string[], provider: string) {
  if (provider !== "elevenlabs") return;
  const chars = texts.reduce((n, t) => n + t.length, 0), credits = estimateCredits(chars), cap = maxCreditsPerVideo();
  if (credits > cap) throw new Error(`render blocked: narration is ${chars} characters = ~${credits} ElevenLabs credits on ${elevenModel()}, over the ${cap} cap. Shorten the script (max ~${maxNarrationChars()} characters) or raise ELEVENLABS_MAX_CREDITS_PER_VIDEO.`);
}

export class ElevenLabsTTSProvider implements TTSProvider {
  async synthesize(text: string, outPath: string, opts: { voice?: string } = {}): Promise<TTSResult> {
    const key = process.env.ELEVENLABS_API_KEY;
    if (!key) throw new Error("ELEVENLABS_API_KEY not set");
    const voice = opts.voice ?? process.env.ELEVENLABS_VOICE_ID ?? "21m00Tcm4TlvDq8ikWAM";
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}/with-timestamps`, {
      method: "POST", headers: { "xi-api-key": key, "content-type": "application/json" },
      body: JSON.stringify({ text, model_id: elevenModel() }),
    });
    if (!res.ok) throw await httpError(res, "ElevenLabs");
    const j: any = await res.json();
    const mp3 = path.join(os.tmpdir(), `el-${process.pid}-${Date.now()}.mp3`);
    fs.writeFileSync(mp3, Buffer.from(j.audio_base64, "base64"));
    await run("ffmpeg", ["-y", "-i", mp3, outPath]);
    fs.rmSync(mp3, { force: true });
    const a = j.alignment ?? j.normalized_alignment;
    const words = charsToWords(a.characters, a.character_start_times_seconds, a.character_end_times_seconds);
    const dur = words.length ? words[words.length - 1].end : 0;
    const credits = estimateCredits(text.length);
    const usdPerCredit = Number(process.env.ELEVENLABS_USD_PER_CREDIT ?? 0.0003); // estimate; check your plan
    return { audioPath: outPath, durationS: dur, words, chars: text.length, credits, costUsd: credits * usdPerCredit, provider: "elevenlabs" };
  }
}


const OPENAI_MAX_CHARS = 4000; // the speech endpoint rejects inputs over 4096 characters

/** Split on sentence boundaries into chunks no longer than max. */
export function chunkText(text: string, max = OPENAI_MAX_CHARS): string[] {
  const out: string[] = [];
  let cur = "";
  for (const sentence of text.match(/[^.!?]+[.!?]*\s*/g) ?? [text]) {
    if (cur && (cur + sentence).length > max) { out.push(cur.trim()); cur = ""; }
    cur += sentence;
    while (cur.length > max) { out.push(cur.slice(0, max)); cur = cur.slice(max); } // pathological: one huge sentence
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/**
 * OpenAI text-to-speech. The API returns audio only (no word timings), so we align by transcribing the
 * generated audio with Whisper, which costs a little extra (~$0.006/min) but gives caption-accurate timings.
 * Model, voice and speaking style are configurable: OPENAI_TTS_MODEL, OPENAI_TTS_VOICE, OPENAI_TTS_INSTRUCTIONS
 * (instructions are only sent to gpt-4o-* models, which accept them).
 */
export class OpenAITTSProvider implements TTSProvider {
  async synthesize(text: string, outPath: string, opts: { voice?: string } = {}): Promise<TTSResult> {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY not set");
    const model = process.env.OPENAI_TTS_MODEL ?? "gpt-4o-mini-tts";
    const voice = opts.voice ?? process.env.OPENAI_TTS_VOICE ?? "onyx";
    const instructions = process.env.OPENAI_TTS_INSTRUCTIONS ?? "You are James, a calm, warm, curious narrator reading his own notes. Natural pacing, friendly and slightly dry, clear emphasis on key numbers, no hype.";
    const parts: string[] = [];
    const chunks = chunkText(text);
    for (let i = 0; i < chunks.length; i++) {
      const res = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST", headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
        body: JSON.stringify({ model, voice, input: chunks[i], response_format: "wav", ...(model.startsWith("gpt-4o") ? { instructions } : {}) }),
      });
      if (!res.ok) throw await httpError(res, "OpenAI TTS");
      const p = `${outPath}.part${i}.wav`;
      fs.writeFileSync(p, Buffer.from(await res.arrayBuffer()));
      parts.push(p);
    }
    if (parts.length === 1) fs.renameSync(parts[0], outPath);
    else {
      const list = `${outPath}.concat.txt`;
      fs.writeFileSync(list, parts.map((p) => `file '${p}'`).join("\n"));
      await run("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", outPath]);
      [...parts, list].forEach((p) => fs.rmSync(p, { force: true }));
    }
    const durationS = await probeDuration(outPath);
    const aligned = await new OpenAITranscriptProvider().transcribe(outPath, durationS);
    const rate = Number(process.env.OPENAI_TTS_USD_PER_1K_CHARS ?? 0.015); // estimate; check current pricing for your model
    return { audioPath: outPath, durationS, words: aligned.words, chars: text.length, costUsd: (text.length / 1000) * rate + aligned.costUsd, provider: `openai:${model}` };
  }
}

/**
 * Long-lived Python worker (tools/kokoro_tts.py) so the Kokoro and Whisper models load once, not per sentence.
 * One request at a time is fine: the models are CPU-bound anyway.
 */
export class KokoroWorker {
  private proc?: ChildProcess;
  private buf = "";
  private pending = new Map<string, { res: (v: any) => void; rej: (e: Error) => void; timer: NodeJS.Timeout }>();

  private ensure(): ChildProcess {
    if (this.proc && this.proc.exitCode === null && !this.proc.killed) return this.proc;
    const py = process.env.KOKORO_PYTHON ?? path.resolve(".venv-tts/bin/python");
    const script = path.resolve("tools/kokoro_tts.py");
    if (!fs.existsSync(py)) throw new Error(`Kokoro python not found at ${py}. Run scripts/setup-kokoro.sh (or set KOKORO_PYTHON).`);
    const p = spawn(py, [script], { stdio: ["pipe", "pipe", "pipe"], env: { ...process.env, KOKORO_MODEL_DIR: process.env.KOKORO_MODEL_DIR ?? path.resolve("models/kokoro") } });
    p.stdout!.on("data", (d: Buffer) => {
      this.buf += d.toString();
      let i: number;
      while ((i = this.buf.indexOf("\n")) >= 0) {
        const line = this.buf.slice(0, i).trim(); this.buf = this.buf.slice(i + 1);
        if (!line) continue;
        try { const m = JSON.parse(line); const w = this.pending.get(m.id); if (w) { clearTimeout(w.timer); this.pending.delete(m.id); m.ok ? w.res(m) : w.rej(new Error(`kokoro: ${m.error}`)); } } catch { /* not protocol output */ }
      }
    });
    p.stderr!.on("data", (d: Buffer) => { if (process.env.KOKORO_VERBOSE) process.stderr.write(`[kokoro] ${d}`); });
    p.on("close", () => { this.proc = undefined; this.pending.forEach((w) => { clearTimeout(w.timer); w.rej(new Error("kokoro worker exited")); }); this.pending.clear(); });
    p.on("error", (e) => { this.pending.forEach((w) => { clearTimeout(w.timer); w.rej(e); }); this.pending.clear(); });
    this.proc = p;
    return p;
  }

  request(req: Record<string, unknown>, timeoutMs = 10 * 60_000): Promise<any> {
    const p = this.ensure();
    const id = crypto.randomUUID();
    return new Promise((res, rej) => {
      const timer = setTimeout(() => { this.pending.delete(id); rej(new Error("kokoro request timed out")); this.close(); }, timeoutMs);
      this.pending.set(id, { res, rej, timer });
      p.stdin!.write(JSON.stringify({ id, ...req }) + "\n");
    });
  }
  close() { this.proc?.kill("SIGTERM"); this.proc = undefined; }
}
export const kokoroWorker = new KokoroWorker();
process.on("exit", () => kokoroWorker.close());

export function kokoroAvailable(): boolean {
  const py = process.env.KOKORO_PYTHON ?? path.resolve(".venv-tts/bin/python");
  const dir = process.env.KOKORO_MODEL_DIR ?? path.resolve("models/kokoro");
  return fs.existsSync(py) && fs.existsSync(path.join(dir, "kokoro-v1.0.onnx")) && fs.existsSync(path.join(dir, "voices-v1.0.bin"));
}

/**
 * Free local voice: Kokoro (Apache-2.0/MIT per its model card; verify) for speech, Whisper (local) for word timings.
 * Timings are mapped onto your exact script words, so captions use your spelling and numbers.
 * Voice: KOKORO_VOICE (default am_michael), speed: KOKORO_SPEED.
 */
export class KokoroTTSProvider implements TTSProvider {
  async synthesize(text: string, outPath: string, opts: { voice?: string } = {}): Promise<TTSResult> {
    const r = await kokoroWorker.request({ text, out: outPath, voice: opts.voice ?? process.env.KOKORO_VOICE, speed: process.env.KOKORO_SPEED ? Number(process.env.KOKORO_SPEED) : undefined });
    return { audioPath: outPath, durationS: r.duration, words: r.words, chars: text.length, costUsd: 0, provider: "kokoro" };
  }
}

export function getTTSProvider(): TTSProvider {
  if (process.env.TTS_PROVIDER === "kokoro") return new KokoroTTSProvider();
  if (process.env.TTS_PROVIDER === "openai") return wrapProvider("openai-tts", new OpenAITTSProvider());
  return process.env.TTS_PROVIDER === "elevenlabs" ? wrapProvider("elevenlabs", new ElevenLabsTTSProvider()) : new MockTTSProvider();
}
