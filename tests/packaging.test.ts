import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { migrate } from "../scripts/migrate";
import { getPool, closePool } from "../src/lib/db";
import { setStorage, LocalStorage } from "../src/lib/storage";
import { MockLLM } from "../src/lib/llm";
import { createProject, generateScript } from "../src/lib/scripts";
import { assembleProject } from "../src/lib/assemble";
import { buildPackaging, titleRuleCheck, buildChapters, DISCLAIMER } from "../src/lib/packaging";
import { contrastRatio } from "../src/lib/thumbnail";
import { run } from "../src/lib/media";

const script = {
  hook: "Stop confusing income with wealth right now.", promise: "Here are four habits that build real wealth over time.",
  beats: [1, 2, 3, 4].map((i) => ({ narration: `Habit ${i}: pay yourself first and automate it, every single month, no matter what.`, visual_query: `money ${i}`, on_screen_text: `HABIT ${i}` })),
  cta: "Follow for more.", claims: [],
};
let tmp: string;
beforeAll(async () => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "vp-"));
  setStorage(new LocalStorage(tmp));
  await getPool().query("drop schema public cascade; create schema public;");
  await migrate();
});
afterAll(async () => { await closePool(); fs.rmSync(tmp, { recursive: true, force: true }); });

describe("promise-delivery validator", () => {
  const b = script as any;
  it("flags count, dollar, timeframe and hype mismatches", () => {
    expect(titleRuleCheck("7 habits that build real wealth fast", b).join()).toMatch(/promises 7 habits but the script has 4/);
    expect(titleRuleCheck("How I made $1M in 30 days online", b).length).toBeGreaterThanOrEqual(2);
    expect(titleRuleCheck("The millionaire secret nobody tells you", b).length).toBe(2);
    expect(titleRuleCheck("4 habits that quietly build wealth", b)).toEqual([]);
    expect(titleRuleCheck("Too short", b)).toContain("title shorter than 15 characters");
  });
});

describe("packaging", () => {
  it("picks only a promise-honest title, builds description, renders accessible thumbnails", async () => {
    const pid = (await createProject({ title: "Habits", format: "long" })).id;
    await generateScript(pid, { style: "seven_habits", llm: new MockLLM(() => script) });
    await assembleProject(pid);
    const llm = new MockLLM((sys) => sys.includes("strict editor")
      ? { results: [{ title: "4 habits that quietly build wealth", delivers: true, issues: [] }] }
      : {
        titles: Array.from({ length: 10 }, (_, i) => ({ title: `Money title option number ${i}` })),
        top3: [{ title: "7 habits that build wealth fast", reasoning: "r" }, { title: "How I made $1M in 30 days online", reasoning: "r" }, { title: "4 habits that quietly build wealth", reasoning: "r" }],
        description: "You will learn four habits.", tags: ["money", "habits"],
        thumbnail_concepts: [
          { text: "STOP BEING POOR RIGHT NOW PLEASE", subject_query: "coins", layout: "left" },
          { text: "4 HABITS", subject_query: "desk", layout: "center" },
          { text: "PAY YOURSELF FIRST", subject_query: "bank", layout: "bottom" },
        ],
      });
    const r = await buildPackaging(pid, { llm });
    expect(r.chosen).toBe("4 habits that quietly build wealth");
    expect(r.promiseCheck.filter((c) => c.ok).length).toBe(1);
    expect(r.description).toContain(DISCLAIMER);
    expect(r.description).toContain("AI-generated");
    expect(r.concepts.length).toBe(3);
    for (const c of r.concepts) {
      expect(c.text.split(/\s+/).length).toBeLessThanOrEqual(4);
      expect(c.contrast).toBeGreaterThanOrEqual(4.5);
      const f = path.join(tmp, c.key);
      const { stdout } = await run("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", f]);
      expect(stdout.trim()).toBe("1280,720");
    }
    expect((await getPool().query("select status from projects where id=$1", [pid])).rows[0].status).toBe("packaged");
  });

  it("no title passes => nothing chosen and project stays unpackaged", async () => {
    const pid = (await createProject({ title: "H2", format: "short" })).id;
    await generateScript(pid, { style: "seven_habits", llm: new MockLLM(() => script) });
    const llm = new MockLLM(() => ({
      titles: [{ title: "a" }, { title: "b" }, { title: "c" }], top3: [{ title: "9 habits to get rich overnight", reasoning: "r" }],
      description: "d", tags: [], thumbnail_concepts: [{ text: "RICH", subject_query: "x", layout: "center" }],
    }));
    const r = await buildPackaging(pid, { llm });
    expect(r.chosen).toBeNull();
    expect((await getPool().query("select status from projects where id=$1", [pid])).rows[0].status).not.toBe("packaged");
  });

  it("contrast math is correct", () => {
    expect(contrastRatio([255, 255, 255], [0, 0, 0])).toBeCloseTo(21, 0);
    expect(contrastRatio([119, 119, 119], [255, 255, 255])).toBeCloseTo(4.48, 1);
  });

  it("chapters need 3+ entries at 10s+ spacing, long-form only", () => {
    const seg = (id: string, kind: any, start: number, on?: string) => ({ id, kind, text: "x y z", start, end: start + 8, voiceKey: "", visual: { type: "image", key: "" }, onScreenText: on });
    const tl: any = { format: "long", segments: [seg("a", "hook", 0), seg("b", "beat", 20, "One"), seg("c", "beat", 45, "Two"), seg("d", "cta", 70)] };
    expect(buildChapters(tl)).toContain("0:20 One");
    expect(buildChapters({ ...tl, format: "short" })).toBe("");
  });
});
