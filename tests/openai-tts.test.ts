import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { run } from "../src/lib/media";
import { OpenAITTSProvider, chunkText } from "../src/lib/providers/tts";

let tmp: string, wav: Buffer;
beforeAll(async () => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tts-"));
  const f = path.join(tmp, "s.wav");
  await run("ffmpeg", ["-y", "-f", "lavfi", "-i", "sine=frequency=300:duration=2", f]);
  wav = fs.readFileSync(f);
  process.env.OPENAI_API_KEY = "test-key";
});
afterAll(() => { vi.restoreAllMocks(); fs.rmSync(tmp, { recursive: true, force: true }); });

function mockFetch() {
  const calls: { url: string; body?: any }[] = [];
  vi.spyOn(globalThis, "fetch").mockImplementation((async (url: string, init: any) => {
    if (String(url).includes("/audio/speech")) { calls.push({ url: String(url), body: JSON.parse(init.body) }); return new Response(new Uint8Array(wav), { status: 200 }); }
    if (String(url).includes("/audio/transcriptions")) { calls.push({ url: String(url) }); return Response.json({ text: "hello world", words: [{ word: "hello", start: 0.1, end: 0.6 }, { word: "world", start: 0.7, end: 1.2 }] }); }
    throw new Error("unexpected " + url);
  }) as any);
  return calls;
}

describe("OpenAI TTS provider", () => {
  it("synthesizes, aligns words via Whisper, and reports cost", async () => {
    const calls = mockFetch();
    const r = await new OpenAITTSProvider().synthesize("Hello world.", path.join(tmp, "out.wav"));
    expect(calls[0].body).toMatchObject({ model: "gpt-4o-mini-tts", voice: "onyx", response_format: "wav", input: "Hello world." });
    expect(calls[0].body.instructions).toMatch(/narrator/);
    expect(r.words).toEqual([{ w: "hello", start: 0.1, end: 0.6 }, { w: "world", start: 0.7, end: 1.2 }]);
    expect(r.durationS).toBeGreaterThan(1.9);
    expect(r.costUsd).toBeGreaterThan(0);
    expect(fs.existsSync(path.join(tmp, "out.wav"))).toBe(true);
    vi.restoreAllMocks();
  });

  it("omits instructions for tts-1 models", async () => {
    process.env.OPENAI_TTS_MODEL = "tts-1";
    const calls = mockFetch();
    await new OpenAITTSProvider().synthesize("Hi there.", path.join(tmp, "o2.wav"));
    expect(calls[0].body.instructions).toBeUndefined();
    delete process.env.OPENAI_TTS_MODEL;
    vi.restoreAllMocks();
  });

  it("splits text over the 4096-char limit into several requests and joins the audio", async () => {
    const calls = mockFetch();
    const long = Array.from({ length: 180 }, (_, i) => `This is sentence number ${i} of the narration.`).join(" ");
    expect(long.length).toBeGreaterThan(8000);
    const r = await new OpenAITTSProvider().synthesize(long, path.join(tmp, "o3.wav"));
    const speech = calls.filter((c) => c.url.includes("/speech"));
    expect(speech.length).toBeGreaterThanOrEqual(3);
    speech.forEach((c) => expect(c.body.input.length).toBeLessThanOrEqual(4000));
    expect(r.durationS).toBeGreaterThan(5); // 3+ joined 2s clips
    vi.restoreAllMocks();
  });

  it("chunkText keeps sentences intact", () => {
    const c = chunkText("One. Two. Three.", 8);
    expect(c.join(" ")).toBe("One. Two. Three.");
    expect(c.every((x) => x.length <= 8)).toBe(true);
  });

  it("fails clearly without a key", async () => {
    const k = process.env.OPENAI_API_KEY; delete process.env.OPENAI_API_KEY;
    await expect(new OpenAITTSProvider().synthesize("x", path.join(tmp, "o4.wav"))).rejects.toThrow(/OPENAI_API_KEY/);
    process.env.OPENAI_API_KEY = k;
  });
});
