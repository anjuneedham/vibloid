import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { migrate } from "../scripts/migrate";
import { getPool, closePool } from "../src/lib/db";
import { setStorage, LocalStorage } from "../src/lib/storage";
import { MockLLM } from "../src/lib/llm";
import { DeferError, logCost } from "../src/lib/queue";
import { createChannel } from "../src/lib/channels";
import { createProject, generateScript, lintScript, renderBlockers, ScriptBody } from "../src/lib/scripts";
import { assembleProject } from "../src/lib/assemble";
import { assertBudget, assertProjectBudget, BudgetExceededError } from "../src/lib/budget";
import { parseCsv, createDataset } from "../src/lib/datasets";
import { renderChartVideo } from "../src/lib/charts";
import { MockVideoProvider } from "../src/lib/providers/videos";
import { MockImageProvider } from "../src/lib/providers/images";
import { buildPackaging, TRADING_RISK } from "../src/lib/packaging";
import { run } from "../src/lib/media";

const base = (over: any = {}) => ({
  hook: "Most beginners misread this one chart.", promise: "Here is what a drawdown really looks like.",
  beats: [
    { narration: "A drawdown is how far a price falls from its peak.", visual_query: "stock ticker screen" },
    { narration: "In early 2020 the index fell sharply in a few weeks.", visual_query: "trading floor" },
    { narration: "Risk of loss is real, so size positions you can survive.", visual_query: "calculator desk" },
  ],
  cta: "Follow for more market history.", claims: [], ...over,
});

const OHLC = "date,open,high,low,close\n2020-02-19,337.0,339.1,335.9,338.3\n2020-02-24,323.0,324.9,320.0,322.4\n2020-03-09,274.0,282.0,268.0,274.2\n2020-03-16,239.0,260.0,235.0,242.2\n2020-03-23,228.0,230.5,218.3,222.5\n";

let tmp: string;
beforeAll(async () => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "vtr-"));
  setStorage(new LocalStorage(tmp));
  await getPool().query("drop schema public cascade; create schema public;");
  await migrate();
});
afterAll(async () => { await closePool(); fs.rmSync(tmp, { recursive: true, force: true }); delete process.env.MONTHLY_BUDGET_USD; delete process.env.PER_VIDEO_BUDGET_USD; });

describe("trading compliance lint", () => {
  it.each([
    ["This setup has a 85% win rate on the daily chart.", "win-rate claim"],
    ["Just copy my trades and watch the account grow.", "copy-trading call to action"],
    ["I made $4,200 last week with this.", "personal earnings claim"],
    ["Learn this and 10x your account in a month.", "multiplier claim"],
    ["It is a sure thing if you wait for the signal.", "sure-thing / free-money claim"],
    ["You will never lose with a stop loss.", "never-lose claim"],
    ["Quit your job and trade full time.", "quit-your-job hype"],
  ])("flags: %s", (line, label) => {
    const hits = lintScript(ScriptBody.parse(base({ cta: line })));
    expect(hits.join()).toContain(label);
  });
  it("passes a clean educational script", () => {
    expect(lintScript(ScriptBody.parse(base()))).toEqual([]);
  });
});

describe("own-app channel disclosure", () => {
  it("brand channel scripts must say it's the creator's own app; attention channels need not", async () => {
    const brand = await createChannel({ name: "Trade Notes", kind: "brand", appName: "Trade Notes", appBlurb: "a trading journal" });
    const attn = await createChannel({ name: "Chart School", kind: "attention" });
    expect(brand.disclosure.description_footer).toMatch(/my own app/);
    const body = ScriptBody.parse(base({ cta: "Try Trade Notes to log your trades." }));
    expect(lintScript(body, brand)).toEqual(expect.arrayContaining([expect.stringMatching(/ownership disclosure/)]));
    expect(lintScript(body, attn)).toEqual([]);
    const ok = ScriptBody.parse(base({ cta: "I built Trade Notes, so I'm biased, but it's built to log your trades." }));
    expect(lintScript(ok, brand)).toEqual([]);
    // flows through generation: policy item blocks render until the script is fixed
    const pid = (await createProject({ title: "Journal", format: "short", channelId: brand.id })).id;
    const s = await generateScript(pid, { style: "explained_simply", llm: new MockLLM(() => body) });
    expect(s.fact_check_items.some((i: any) => i.kind === "policy" && /ownership/.test(i.text))).toBe(true);
    expect(renderBlockers(s.body, s.fact_check_items, brand).length).toBeGreaterThan(0);
  });

  it("packaging adds the channel's own-product disclosure and the trading risk warning", async () => {
    const brand = (await getPool().query("select * from channels where kind='brand'")).rows[0];
    const pid = (await createProject({ title: "Journal2", format: "short", channelId: brand.id })).id;
    await generateScript(pid, { style: "explained_simply", llm: new MockLLM(() => base({ cta: "I built Trade Notes, so I'm biased." })) });
    const llm = new MockLLM((sys) => sys.includes("strict editor") ? { results: [{ title: "3 chart facts every beginner misses", delivers: true, issues: [] }] }
      : { titles: [{ title: "a" }, { title: "b" }, { title: "c" }], top3: [{ title: "3 chart facts every beginner misses", reasoning: "r" }], description: "Learn it.", tags: ["trading"], thumbnail_concepts: [{ text: "DRAWDOWN EXPLAINED", subject_query: "chart", layout: "left" }] });
    const r = await buildPackaging(pid, { llm, images: new MockImageProvider() });
    expect(r.description).toContain("Trade Notes is my own app");
    expect(r.description).toContain(TRADING_RISK);
  });
});

describe("hard budget cap", () => {
  it("defers (does not fail) once the monthly cap is reached, and resumes when raised", async () => {
    process.env.MONTHLY_BUDGET_USD = "1.00";
    await getPool().query("delete from job_costs");
    await assertBudget(0.5);                                   // fine
    await logCost({ provider: "x", unit: "u", quantity: 1, costUsd: 0.9 });
    const err = await assertBudget(0.2).catch((e) => e);
    expect(err).toBeInstanceOf(BudgetExceededError);
    expect(err).toBeInstanceOf(DeferError);                    // jobs are postponed, not burned
    expect(err.message).toMatch(/monthly budget reached/);
    process.env.MONTHLY_BUDGET_USD = "5";
    await expect(assertBudget(0.2)).resolves.toBeUndefined();
  });
  it("enforces a per-video cap too", async () => {
    process.env.PER_VIDEO_BUDGET_USD = "0.10";
    const pid = (await createProject({ title: "Cap", format: "short" })).id;
    await logCost({ projectId: pid, provider: "x", unit: "u", quantity: 1, costUsd: 0.08 });
    await expect(assertProjectBudget(pid, 0.05)).rejects.toThrow(/per-video budget/);
    await expect(assertProjectBudget(pid, 0.01)).resolves.toBeUndefined();
    delete process.env.PER_VIDEO_BUDGET_USD;
  });
});

describe("datasets and charts", () => {
  it("parses OHLC and simple series CSV, and rejects bad data", () => {
    const o = parseCsv(OHLC);
    expect(o.kind).toBe("ohlc"); expect(o.points.length).toBe(5);
    const s = parseCsv("date,value\n2024-01-01,100\n2024-01-02,\"1,050.5\"\n");
    expect(s.kind).toBe("series"); expect((s.points[1] as any).v).toBe(1050.5);
    expect(() => parseCsv("date,open,high,low,close\n2020-01-01,10,9,8,9\n2020-01-02,1,2,1,2\n")).toThrow(/inconsistent/);
    expect(() => parseCsv("date,value\n2020-01-01,abc\n2020-01-02,2\n")).toThrow(/not a number/);
    expect(() => parseCsv("foo,bar\n1,2\n3,4\n")).toThrow(/date column/);
  });
  it("requires a source for every dataset", async () => {
    await expect(createDataset({ name: "x", source: " ", csv: OHLC })).rejects.toThrow(/source/);
  });
  it("renders an animated chart video at the requested size and duration", async () => {
    const ds: any = { id: "x", name: "SPY drawdown", kind: "ohlc", source: "Test data", source_url: null, as_of: "2020-03-23", points: parseCsv(OHLC).points, notes: null };
    for (const kind of ["line", "candles", "bars", "counter"] as const) {
      const out = path.join(tmp, `chart-${kind}.mp4`);
      await renderChartVideo({ ds, spec: { kind }, width: 360, height: 640, durationS: 1.2, outPath: out });
      const { stdout } = await run("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:format=duration", "-of", "csv=p=0", out]);
      expect(stdout).toContain("360,640");
      expect(fs.statSync(out).size).toBeGreaterThan(5000);
    }
  });
});

describe("assembly with real-footage, chart and AI visuals", () => {
  const withVisuals = () => base({
    beats: [
      { narration: "A drawdown is how far a price falls from its peak.", visual_query: "stock ticker screen", visual_type: "stock_video" },
      { narration: "In early 2020 the index fell sharply in a few weeks.", visual_query: "chart", visual_type: "chart", chart: { dataset: "SPY drawdown 2020", kind: "candles", title: "The 2020 drop" } },
      { narration: "Panic can feel like the floor is disappearing.", visual_query: "storm", visual_type: "ai_image", ai_prompt: "a lone figure on a cliff edge at dusk" },
      { narration: "A second striking image should fall back because the AI cap is one.", visual_query: "market crash", visual_type: "ai_image", ai_prompt: "falling dominoes" },
    ],
  });

  it("uses stock video, a sourced chart and AI stills (capped), recording licenses", async () => {
    process.env.AI_MAX_PER_VIDEO = "1";
    await createDataset({ name: "SPY drawdown 2020", source: "Test data (illustrative)", as_of: "2020-03-23", csv: OHLC });
    const pid = (await createProject({ title: "Visuals", format: "short" })).id;
    await generateScript(pid, { style: "explained_simply", llm: new MockLLM(() => withVisuals()) });
    const tl = await assembleProject(pid, { videos: new MockVideoProvider(), aiImages: new MockImageProvider() });
    const types = tl.segments.map((s) => s.visual.type);
    expect(types).toContain("video"); expect(types).toContain("chart");
    expect(types.filter((t) => t === "ai_image").length).toBe(1);   // cap honored, second AI beat fell back
    const chart = tl.segments.find((s) => s.visual.type === "chart")!;
    expect(fs.existsSync(path.join(tmp, chart.visual.key))).toBe(true);
    const assets = (await getPool().query("select kind, license, meta from assets where project_id=$1 and kind in ('video','image')", [pid])).rows;
    assets.forEach((a) => expect(a.license.license).toBeTruthy());
    expect(assets.find((a) => a.meta.chart)?.meta.source).toBe("Test data (illustrative)");
    delete process.env.AI_MAX_PER_VIDEO;
  });

  it("blocks the render when a chart references a dataset that does not exist (never invents data)", async () => {
    const pid = (await createProject({ title: "NoData", format: "short" })).id;
    const b = withVisuals(); b.beats[1].chart.dataset = "Made up numbers";
    await generateScript(pid, { style: "explained_simply", llm: new MockLLM(() => b) });
    await expect(assembleProject(pid, { videos: new MockVideoProvider(), aiImages: new MockImageProvider() })).rejects.toThrow(/does not exist/);
  });

  it("stops before paying for an AI image when the budget is exhausted", async () => {
    process.env.MONTHLY_BUDGET_USD = "0.01";
    await logCost({ provider: "x", unit: "u", quantity: 1, costUsd: 0.5 });
    const pid = (await createProject({ title: "Broke", format: "short" })).id;
    await generateScript(pid, { style: "explained_simply", llm: new MockLLM(() => withVisuals()) });
    await expect(assembleProject(pid, { videos: new MockVideoProvider(), aiImages: new MockImageProvider() })).rejects.toBeInstanceOf(BudgetExceededError);
    delete process.env.MONTHLY_BUDGET_USD;
  });
});
