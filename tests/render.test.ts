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
import { renderProject } from "../src/lib/render";
import { run, probeDuration } from "../src/lib/media";

// ~45s of narration at the mock TTS rate (2.6 words/s)
const sentence = (n: number) => Array.from({ length: n }, (_, i) => `word${i}`).join(" ") + ".";
const script = {
  hook: "Stop confusing income with wealth right now.",
  promise: "Here are four habits that quietly build real wealth over time.",
  beats: [1, 2, 3, 4].map((i) => ({ narration: `Habit ${i}: ` + sentence(24), visual_query: `money habit ${i}`, on_screen_text: `HABIT ${i}` })),
  cta: "Follow for one money idea every single day.", claims: [],
};
let tmp: string, pid: string;
beforeAll(async () => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "vr-"));
  setStorage(new LocalStorage(tmp));
  await getPool().query("drop schema public cascade; create schema public;");
  await migrate();
  pid = (await createProject({ title: "Habits", format: "short" })).id;
  await generateScript(pid, { style: "seven_habits", llm: new MockLLM(() => script) });
  await assembleProject(pid);
});
afterAll(async () => { await closePool(); fs.rmSync(tmp, { recursive: true, force: true }); });

describe("render", () => {
  it("renders a ~45s Short, 1080x1920, near -14 LUFS, and reports timing", async () => {
    const t0 = Date.now();
    const r = await renderProject(pid, "final");
    const secs = (Date.now() - t0) / 1000;
    console.log(`final render took ${secs.toFixed(1)}s, ${(Number(r.size_bytes) / 1e6).toFixed(1)}MB, duration ${Number(r.duration_s).toFixed(1)}s`);
    expect(Number(r.duration_s)).toBeGreaterThan(40);
    expect(secs).toBeLessThan(120);
    const p = new LocalStorage(tmp).localPath(r.storage_key);
    const { stdout } = await run("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", p]);
    expect(stdout.trim()).toBe("1080,1920");
    const loud = await run("ffmpeg", ["-i", p, "-af", "ebur128=peak=true", "-f", "null", "-"]);
    const m = loud.stderr.match(/I:\s+(-?[\d.]+) LUFS/g)!.pop()!.match(/(-?[\d.]+)/)![1];
    expect(Math.abs(Number(m) - -14)).toBeLessThan(2.5);
  });

  it("re-run with same input is idempotent (reuses render)", async () => {
    const a = await renderProject(pid, "final");
    expect(a.reused).toBe(true);
    expect((await getPool().query("select count(*) from renders where kind='final'")).rows[0].count).toBe("1");
  });

  it("forced re-render produces byte-identical output (deterministic hash)", async () => {
    const first = (await getPool().query("select output_hash from renders where kind='final'")).rows[0].output_hash;
    const again = await renderProject(pid, "final", { force: true });
    expect(again.output_hash).toBe(first);
  });

  it("preview is half-res and smaller", async () => {
    const r = await renderProject(pid, "preview");
    const p = new LocalStorage(tmp).localPath(r.storage_key);
    const { stdout } = await run("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", p]);
    expect(stdout.trim()).toBe("540,960");
  });

  it("resumes after failure: finished segments are not re-rendered", async () => {
    const dir = path.join(tmp, `projects/${pid}/render-final`);
    const segs = fs.readdirSync(dir).filter((f) => f.startsWith("v-") && f.endsWith(".mp4"));
    expect(segs.length).toBe(7); // hook, promise, 4 beats, cta
    const mtimes = segs.map((f) => fs.statSync(path.join(dir, f)).mtimeMs);
    fs.unlinkSync(path.join(dir, segs[2]));                        // simulate a crash that lost one segment
    await getPool().query("delete from renders");                  // force the re-render path
    await renderProject(pid, "final");
    segs.forEach((f, i) => { if (i !== 2) expect(fs.statSync(path.join(dir, f)).mtimeMs).toBe(mtimes[i]); });
  });
});
