import { describe, it, expect, afterAll } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { KokoroTTSProvider, kokoroAvailable, kokoroWorker } from "../src/lib/providers/tts";
import { probeDuration } from "../src/lib/media";

// Runs the REAL local voice. Skipped automatically where scripts/setup-kokoro.sh has not been run.
const ready = kokoroAvailable();
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "kk-"));
afterAll(() => { kokoroWorker.close(); fs.rmSync(tmp, { recursive: true, force: true }); });

describe.skipIf(!ready)("Kokoro + Whisper alignment (real models)", () => {
  const text = "Most beginners misread this one chart. In early 2020 the index fell about 34% in five weeks.";

  it("speaks the text and returns every SCRIPT word with sane, ordered timings", async () => {
    const out = path.join(tmp, "a.wav");
    const r = await new KokoroTTSProvider().synthesize(text, out);
    expect(fs.existsSync(out)).toBe(true);
    expect(Math.abs((await probeDuration(out)) - r.durationS)).toBeLessThan(0.1);
    expect(r.durationS).toBeGreaterThan(4);
    expect(r.costUsd).toBe(0);
    expect(r.words.map((w) => w.w)).toEqual(text.split(" "));         // exact script spelling, incl. "34%"
    r.words.forEach((w, i) => {
      expect(w.start).toBeGreaterThanOrEqual(0);
      expect(w.end).toBeGreaterThan(w.start);
      expect(w.end).toBeLessThanOrEqual(r.durationS + 0.05);
      if (i) expect(w.start).toBeGreaterThanOrEqual(r.words[i - 1].start);
    });
    expect(r.words[0].start).toBeLessThan(0.6);                         // speech starts near the start
    expect(r.words[r.words.length - 1].end).toBeGreaterThan(r.durationS - 1.2); // and the last word near the end
  }, 120_000);

  it("reuses the loaded models: a second request is much faster than a cold start", async () => {
    const t0 = Date.now();
    await new KokoroTTSProvider().synthesize("A drawdown is how far a price falls from its peak.", path.join(tmp, "b.wav"));
    expect(Date.now() - t0).toBeLessThan(25_000);
  }, 120_000);

  it("reports a clear error for an unknown voice and keeps serving afterwards", async () => {
    await expect(new KokoroTTSProvider().synthesize("Hello there.", path.join(tmp, "c.wav"), { voice: "nope_voice" })).rejects.toThrow(/unknown voice/);
    const r = await new KokoroTTSProvider().synthesize("Still working.", path.join(tmp, "d.wav"));
    expect(r.words.length).toBe(2);
  }, 120_000);
});

describe("kokoroAvailable", () => {
  it("is false when the python path does not exist", () => {
    const old = process.env.KOKORO_PYTHON; process.env.KOKORO_PYTHON = "/nonexistent/python";
    expect(kokoroAvailable()).toBe(false);
    if (old === undefined) delete process.env.KOKORO_PYTHON; else process.env.KOKORO_PYTHON = old;
  });
});
