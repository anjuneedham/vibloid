import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { run, probeDuration } from "../media";
import { OpenAITranscriptProvider } from "./transcript";
import type { Word } from "./transcript";
import { httpError, wrapProvider } from "../resilience";

export type TTSResult = { audioPath: string; durationS: number; words: Word[]; costUsd: number; provider: string; chars: number };
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

export class ElevenLabsTTSProvider implements TTSProvider {
  async synthesize(text: string, outPath: string, opts: { voice?: string } = {}): Promise<TTSResult> {
    const key = process.env.ELEVENLABS_API_KEY;
    if (!key) throw new Error("ELEVENLABS_API_KEY not set");
    const voice = opts.voice ?? process.env.ELEVENLABS_VOICE_ID ?? "21m00Tcm4TlvDq8ikWAM";
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}/with-timestamps`, {
      method: "POST", headers: { "xi-api-key": key, "content-type": "application/json" },
      body: JSON.stringify({ text, model_id: process.env.ELEVENLABS_MODEL ?? "eleven_multilingual_v2" }),
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
    const rate = Number(process.env.ELEVENLABS_USD_PER_1K_CHARS ?? 0.3); // estimate; check your plan
    return { audioPath: outPath, durationS: dur, words, chars: text.length, costUsd: (text.length / 1000) * rate, provider: "elevenlabs" };
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
    const instructions = process.env.OPENAI_TTS_INSTRUCTIONS ?? "Speak like a confident, warm documentary narrator. Natural pacing, clear emphasis on key numbers, no hype.";
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

export function getTTSProvider(): TTSProvider {
  if (process.env.TTS_PROVIDER === "openai") return wrapProvider("openai-tts", new OpenAITTSProvider());
  return process.env.TTS_PROVIDER === "elevenlabs" ? wrapProvider("elevenlabs", new ElevenLabsTTSProvider()) : new MockTTSProvider();
}
