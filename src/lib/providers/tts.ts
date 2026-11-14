import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { run } from "../media";
import type { Word } from "./transcript";

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
    if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${(await res.text()).slice(0, 300)}`);
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

export function getTTSProvider(): TTSProvider {
  return process.env.TTS_PROVIDER === "elevenlabs" ? new ElevenLabsTTSProvider() : new MockTTSProvider();
}
