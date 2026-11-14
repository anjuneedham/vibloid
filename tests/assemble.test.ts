import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { migrate } from "../scripts/migrate";
import { getPool, closePool } from "../src/lib/db";
import { setStorage, LocalStorage } from "../src/lib/storage";
import { MockLLM } from "../src/lib/llm";
import { createProject, generateScript, resolveFactItem } from "../src/lib/scripts";
import { assembleProject } from "../src/lib/assemble";
import { buildAss, parseAssStarts } from "../src/lib/captions";
import { charsToWords } from "../src/lib/providers/tts";

const clean = {
  hook: "Your savings account is quietly losing money.", promise: "Here is one habit that helps you keep up with inflation.",
  beats: [
    { narration: "Prices rise a little every year, so cash loses buying power.", visual_query: "grocery prices" },
    { narration: "Automate a transfer into a low cost index fund on payday.", visual_query: "phone banking app", on_screen_text: "AUTOMATE IT" },
    { narration: "Small steady habits beat occasional big moves.", visual_query: "calendar" },
  ],
  cta: "Follow for one money idea a day.", claims: [],
};
let tmp: string;
beforeAll(async () => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "va-"));
  setStorage(new LocalStorage(tmp));
  await getPool().query("drop schema public cascade; create schema public;");
  await migrate();
});
afterAll(async () => { await closePool(); fs.rmSync(tmp, { recursive: true, force: true }); });

describe("assembly", () => {
  it("captions are synced within 100ms of word timings", () => {
    const words = Array.from({ length: 40 }, (_, i) => ({ w: `word${i}.`.replace(".", i % 7 === 0 ? "." : ""), start: i * 0.37, end: i * 0.37 + 0.33 }));
    const starts = parseAssStarts(buildAss(words, { width: 1080, height: 1920 }));
    expect(starts.length).toBe(words.length);
    starts.forEach((s, i) => expect(Math.abs(s - words[i].start)).toBeLessThanOrEqual(0.1));
  });

  it("converts ElevenLabs char alignment to words", () => {
    const w = charsToWords([..."hi you"], [0, .1, .2, .3, .4, .5], [.1, .2, .3, .4, .5, .6]);
    expect(w).toEqual([{ w: "hi", start: 0, end: .2 }, { w: "you", start: .3, end: .6 }]);
  });

  it("assembles timeline with license metadata on every third-party asset", async () => {
    const pid = (await createProject({ title: "Habit", format: "short" })).id;
    await generateScript(pid, { style: "explained_simply", llm: new MockLLM(() => clean) });
    const tl = await assembleProject(pid);
    expect(tl.segments.length).toBe(1 + 1 + 3 + 1); // hook, promise, 3 beats, cta
    expect(tl.segments[0].start).toBe(0);
    for (let i = 1; i < tl.segments.length; i++) expect(tl.segments[i].start).toBeGreaterThan(tl.segments[i - 1].end);
    const assets = (await getPool().query("select kind, license from assets where project_id=$1 and kind in ('image','music')", [pid])).rows;
    expect(assets.length).toBeGreaterThan(3);
    assets.forEach((a) => expect(a.license.license).toBeTruthy());
    expect((await getPool().query("select status from projects where id=$1", [pid])).rows[0].status).toBe("assembled");
  });

  it("blocks assembly while fact-check items are unresolved", async () => {
    const pid = (await createProject({ title: "Stat", format: "short" })).id;
    const withStat = { ...clean, beats: [{ ...clean.beats[0], narration: "Inflation averaged 3 percent [CITATION NEEDED]." }, ...clean.beats.slice(1)], claims: [{ text: "3%", needs_source: true }] };
    const s = await generateScript(pid, { style: "myth_vs_reality", llm: new MockLLM(() => withStat) });
    await expect(assembleProject(pid)).rejects.toThrow(/render blocked/);
    await resolveFactItem(s.id, s.fact_check_items[0].id, { source: "BLS" });
    await expect(assembleProject(pid)).resolves.toBeTruthy();
  });

  it("blocks assembly when a referenced clip's source has unknown rights", async () => {
    const sid = (await getPool().query("insert into sources (type,url,rights_status,status,storage_key) values ('link','http://x','unknown','ready','x.mp4') returning id")).rows[0].id;
    const cid = (await getPool().query("insert into clips (source_id,start_s,end_s) values ($1,1,20) returning id", [sid])).rows[0].id;
    const pid = (await createProject({ title: "Bad", format: "short", clipIds: [cid] })).id;
    await generateScript(pid, { style: "explained_simply", llm: new MockLLM(() => clean) });
    await expect(assembleProject(pid)).rejects.toThrow(/unknown/);
  });
});
