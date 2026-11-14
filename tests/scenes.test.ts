import { describe, it, expect } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createCanvas } from "@napi-rs/canvas";
import { drawScene, renderSceneVideo, SAMPLE_LABEL, type Scene } from "../src/lib/scenes";
import { buildAss, buildSrt, buildVtt, buildCues, chunkWords } from "../src/lib/captions";
import { run } from "../src/lib/media";

const words = [
  "A", "seventy", "percent", "win", "rate", "can", "still", "lose", "you", "money.", "Here", "is", "how", "it", "works,", "using", "ten", "sample", "trades.",
].map((w, i) => ({ w, start: i * 0.4, end: i * 0.4 + 0.35 }));

const SCENES: Scene[] = [
  { kind: "kinetic", lines: [{ text: "70% WIN RATE" }, { text: "LOSE MONEY", color: "loss" }], sub: "sub", badge: true },
  { kind: "chips", items: [{ t: "+$20", k: "win" }, { t: "-$80", k: "loss" }] },
  { kind: "sum", won: 140, lost: 240, trades: 10 },
  { kind: "kpis", note: "Based on 10 closed trades.", cards: [{ label: "Win rate", value: "70%" }, { label: "Net P&L", value: "-$100.00", tone: "loss" }] },
  { kind: "progress", have: 10, need: 30, caption: "too early" },
  { kind: "endcard", title: "TradeNotes", tagline: "One. Two. Three.", small: "Not financial advice." },
];

describe("animated scenes", () => {
  it("every scene kind draws without throwing at the start, middle and end", () => {
    const c = createCanvas(270, 480), ctx = c.getContext("2d") as any;
    for (const s of SCENES) for (const t of [0, 1.5, 3]) expect(() => drawScene(ctx, 270, 480, t, 3, s)).not.toThrow();
  });

  it("scenes that look like app data always carry the sample-data label (checked by pixels: badge region is not background)", () => {
    expect(SAMPLE_LABEL).toBe("SAMPLE DATA · NOT REAL TRADES");
    const W = 540, H = 960;
    for (const s of SCENES.filter((x) => ["chips", "sum", "kpis", "progress"].includes(x.kind))) {
      const c = createCanvas(W, H), ctx = c.getContext("2d") as any;
      drawScene(ctx, W, H, 2.5, 3, s);
      const px = ctx.getImageData(W * 0.3, H * 0.085, W * 0.4, H * 0.05).data; // where the badge sits
      let amber = 0;
      for (let i = 0; i < px.length; i += 4) if (px[i] > 200 && px[i + 1] > 140 && px[i + 2] < 90) amber++;
      expect(amber, `${s.kind} is missing the SAMPLE DATA badge`).toBeGreaterThan(20);
    }
  });

  it("long text shrinks to fit instead of overflowing the frame", () => {
    const W = 540, H = 960, c = createCanvas(W, H), ctx = c.getContext("2d") as any;
    drawScene(ctx, W, H, 3, 3, { kind: "kinetic", lines: [{ text: "AN EXTREMELY LONG HEADLINE THAT CANNOT POSSIBLY FIT ON ONE LINE" }] });
    const row = (x: number) => ctx.getImageData(x, H * 0.3, 1, H * 0.12).data;
    // nothing bright touches the outer 2% margins
    for (const x of [1, W - 2]) { const d = row(x); for (let i = 0; i < d.length; i += 4) expect(d[i] + d[i + 1] + d[i + 2]).toBeLessThan(200); }
  });

  it("renders to a real mp4 at the requested size and length", async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sc-"));
    const out = path.join(tmp, "s.mp4");
    await renderSceneVideo({ scene: SCENES[3], width: 360, height: 640, durationS: 1.5, outPath: out });
    const { stdout } = await run("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:format=duration", "-of", "csv=p=0", out]);
    expect(stdout).toContain("360,640");
    expect(Number(stdout.trim().split("\n").pop())).toBeCloseTo(1.5, 0);
    fs.rmSync(tmp, { recursive: true, force: true });
  }, 60_000);
});

describe("captions: TradeNotes (Andrew Builds) preset", () => {
  it("uses 58px-at-1080 text, a 62% opaque dark box, amber highlight, and keeps the box bottom at 70% of the frame", () => {
    const ass = buildAss(words, { width: 1080, height: 1920, preset: "andrew" });
    const style = ass.split("\n").find((l) => l.startsWith("Style: Cap"))!.split(",");
    expect(style[2]).toBe("58");                                  // font size
    expect(style[5]).toBe("&H611A0F0A");                           // box colour: navy at ~62% opacity (alpha 0x61)
    expect(style[15]).toBe("3");                                   // BorderStyle 3 = box
    expect(Number(style[21])).toBe(Math.round(1920 * 0.3) + 16);   // MarginV puts the box bottom at 70% height
    expect(ass).toContain("&H001EB0F2&");                          // amber #F2B01E (BGR)
    expect(ass).not.toContain("SEVENTY");                          // sentence case, not shouting
    expect(ass).toContain("seventy");
  });
  it("never puts more than 24 characters on a caption line", () => {
    const many = Array.from({ length: 60 }, (_, i) => ({ w: ["beginners", "misread", "expectancy", "drawdown"][i % 4], start: i * 0.3, end: i * 0.3 + 0.25 }));
    for (const chunk of chunkWords(many)) expect(chunk.map((w) => w.w).join(" ").length).toBeLessThanOrEqual(24);
  });
});

describe("caption files for upload", () => {
  it("SRT has numbered, ordered, non-overlapping cues with comma timestamps", () => {
    const srt = buildSrt(words);
    expect(srt.startsWith("1\n00:00:00,000 --> ")).toBe(true);
    const cues = buildCues(words);
    cues.forEach((c, i) => { expect(c.end).toBeGreaterThan(c.start); if (i) expect(c.start).toBeGreaterThanOrEqual(cues[i - 1].end - 1e-9); });
    expect(srt).toContain("2\n");
    expect(srt).toContain("seventy");
  });
  it("VTT has the header and dot timestamps", () => {
    const vtt = buildVtt(words);
    expect(vtt.startsWith("WEBVTT\n\n")).toBe(true);
    expect(vtt).toMatch(/00:00:00\.000 --> \d\d:\d\d:\d\d\.\d{3}/);
  });
});
