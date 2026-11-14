import fs from "node:fs";

export type Word = { w: string; start: number; end: number };
export type Transcript = { text: string; words: Word[]; provider: string; costUsd: number };

export interface TranscriptProvider {
  transcribe(audioPath: string, durationS: number): Promise<Transcript>;
}

const MOCK_TEXT =
  "Most people never build wealth because they confuse income with assets. " +
  "Pay yourself first, automate your savings, and let compound interest do the heavy lifting. " +
  "Rich people buy assets that produce cash flow. Everyone else buys liabilities that look like assets. " +
  "The best time to start investing was ten years ago, and the second best time is today. " +
  "Discipline beats motivation every single time, so build systems instead of chasing feelings.";

/** Deterministic transcript spread evenly over the duration. For dev/tests. */
export class MockTranscriptProvider implements TranscriptProvider {
  async transcribe(_p: string, durationS: number): Promise<Transcript> {
    const tokens = MOCK_TEXT.split(/\s+/);
    const per = durationS / tokens.length;
    const words = tokens.map((w, i) => ({ w, start: +(i * per).toFixed(3), end: +((i + 1) * per - 0.02).toFixed(3) }));
    return { text: MOCK_TEXT, words, provider: "mock", costUsd: 0 };
  }
}

export class OpenAITranscriptProvider implements TranscriptProvider {
  async transcribe(audioPath: string, durationS: number): Promise<Transcript> {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY not set");
    const form = new FormData();
    form.append("file", new Blob([fs.readFileSync(audioPath)]), "audio.wav");
    form.append("model", "whisper-1");
    form.append("response_format", "verbose_json");
    form.append("timestamp_granularities[]", "word");
    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", { method: "POST", headers: { Authorization: `Bearer ${key}` }, body: form });
    if (!res.ok) throw new Error(`transcription failed: ${res.status} ${await res.text()}`);
    const j: any = await res.json();
    const words: Word[] = (j.words ?? []).map((x: any) => ({ w: x.word, start: x.start, end: x.end }));
    return { text: j.text, words, provider: "openai-whisper", costUsd: (durationS / 60) * 0.006 };
  }
}

export function getTranscriptProvider(): TranscriptProvider {
  return process.env.TRANSCRIPT_PROVIDER === "openai" ? new OpenAITranscriptProvider() : new MockTranscriptProvider();
}
