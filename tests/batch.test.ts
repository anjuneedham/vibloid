import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { migrate } from "../scripts/migrate";
import { getPool, closePool } from "../src/lib/db";
import { setStorage, LocalStorage } from "../src/lib/storage";
import { MockLLM, setLLM } from "../src/lib/llm";
import { ScriptedLLM } from "../src/lib/llm-scripted";
import { createChannel } from "../src/lib/channels";
import { planBatch, distinctStyles, batchStatus } from "../src/lib/batch";
import { produceProject } from "../src/lib/produce";
import { resolveFactItem } from "../src/lib/scripts";
import { approveProject, uploadApproved } from "../src/lib/publish";
import { MockYouTubeClient } from "../src/lib/youtube";
import { createDataset } from "../src/lib/datasets";

let tmp: string, attn: any, brand: any;

beforeAll(async () => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "vb-"));
  setStorage(new LocalStorage(tmp));
  process.env.VIDEO_PROVIDER = "mock";
  await getPool().query("drop schema public cascade; create schema public;");
  await migrate();
  attn = await createChannel({ name: "Chart School", kind: "attention" });
  brand = await createChannel({ name: "Trade Notes", kind: "brand", appName: "Trade Notes", appBlurb: "a trading journal" });
  setLLM(new ScriptedLLM());
});
afterAll(async () => { delete process.env.VIDEO_PROVIDER; await closePool(); fs.rmSync(tmp, { recursive: true, force: true }); });

describe("batch planning", () => {
  it("reassigns duplicate styles so every attention video tests a different format", () => {
    const out = distinctStyles([{ style: "explained_simply" }, { style: "explained_simply" }, { style: "myth_vs_reality" }, { style: "explained_simply" }]);
    expect(new Set(out.map((o) => o.style)).size).toBe(4);
  });

  it("plans 4 attention + 2 brand videos on the right channels and queues production for each", async () => {
    const idea = (i: number, style: string) => ({ topic: `Topic number ${i} for the batch`, hook_idea: "A curious hook idea here", style, hypothesis: "h", dataset: null });
    const llm = new MockLLM(() => ({
      attention: [idea(1, "explained_simply"), idea(2, "explained_simply"), idea(3, "myth_vs_reality"), idea(4, "seven_habits")],
      brand: [idea(5, "explained_simply"), idea(6, "story_motivation")],
    }));
    const r = await planBatch({ attentionChannelId: attn.id, brandChannelId: brand.id, llm });
    expect(r.projects.length).toBe(6);
    const rows = (await getPool().query("select c.kind, p.brief->>'style' as style, p.format from projects p join channels c on c.id=p.channel_id where p.batch_id=$1", [r.batchId])).rows;
    expect(rows.filter((x) => x.kind === "attention").length).toBe(4);
    expect(rows.filter((x) => x.kind === "brand").length).toBe(2);
    expect(new Set(rows.filter((x) => x.kind === "attention").map((x) => x.style)).size).toBe(4);
    expect(rows.every((x) => x.format === "short")).toBe(true);
    expect((await getPool().query("select count(*) from jobs where type='produce_project' and state='queued'")).rows[0].count).toBe("6");
    expect(llm.calls[0].user).toContain("ATTENTION_COUNT: 4");
    const status = await batchStatus();
    expect(status[0].projects.length).toBe(6);
  });

  it("rejects swapped channel kinds and a short model answer", async () => {
    await expect(planBatch({ attentionChannelId: brand.id, brandChannelId: attn.id, llm: new MockLLM(() => ({})) })).rejects.toThrow(/attention channel and a brand channel/);
    const one = { topic: "Only one idea here", hook_idea: "A curious hook idea", style: "explained_simply" };
    await expect(planBatch({ attentionChannelId: attn.id, brandChannelId: brand.id, llm: new MockLLM(() => ({ attention: [one], brand: [one] })) })).rejects.toThrow(/need 4\+2/);
  });
});

describe("produce pipeline: idea to ready-for-review", () => {
  it("stops for a human at the fact-check gate, then continues to a packaged video; brand video carries the own-app disclosure and uploads privately", async () => {
    await createDataset({ name: "SPY drawdown 2020", source: "Illustrative sample data", as_of: "2020-03-23", csv: "date,open,high,low,close\n2020-02-19,337,339,335,338\n2020-03-23,228,230,218,222\n2020-03-26,237,247,236,246\n" });
    const mk = async (channelId: string, title: string) => (await getPool().query("insert into projects (title,format,topic,status,channel_id,brief) values ($1,'short',$1,'draft',$2,'{\"style\":\"explained_simply\"}') returning id", [title, channelId])).rows[0].id as string;
    const pid = await mk(brand.id, "Journal habit that fixes repeat mistakes");

    const first = await produceProject(pid);
    expect(first.stage).toBe("needs_review");
    expect((first as any).blockers.join()).toMatch(/fact-check/);
    expect((await getPool().query("select pipeline from projects where id=$1", [pid])).rows[0].pipeline.stage).toBe("needs_review");
    expect((await getPool().query("select count(*) from renders where project_id=$1", [pid])).rows[0].count).toBe("0"); // nothing rendered while blocked

    const s = (await getPool().query("select * from scripts where project_id=$1 order by version desc limit 1", [pid])).rows[0];
    const items = s.fact_check_items.filter((i: any) => i.kind !== "policy");
    expect(s.fact_check_items.some((i: any) => i.kind === "policy")).toBe(false); // ownership disclosure was written
    let latest = s;
    for (const it of items) latest = await resolveFactItem(latest.id, it.id, { source: "BLS CPI series" });

    const second = await produceProject(pid);
    expect(second.stage).toBe("packaged");
    const pk = (await getPool().query("select * from packaging where project_id=$1", [pid])).rows[0];
    expect(pk.description).toContain("Trade Notes is my own app");
    expect(pk.description).toContain("Trading and investing involve substantial risk");

    // still needs a human to publish
    expect((await getPool().query("select count(*) from publish_queue where project_id=$1", [pid])).rows[0].count).toBe("0");
    const item = await approveProject(pid, { approvedBy: "owner", previewWatched: true });
    const yt = new MockYouTubeClient();
    const done = await uploadApproved(item.id, yt);
    expect(done.status).toBe("uploaded_private");
    expect(yt.uploads[0].meta.description).toContain("my own app");
    expect(yt.uploads[0].meta.syntheticMedia).toBe(true);
  }, 240_000);

  it("a produce job is blocked from spending once the monthly budget is gone", async () => {
    process.env.MONTHLY_BUDGET_USD = "0.001";
    await getPool().query("insert into job_costs (provider, unit, quantity, cost_usd) values ('x','u',1,1)");
    const pid = (await getPool().query("insert into projects (title,format,topic,status,channel_id) values ('Broke','short','Broke','draft',$1) returning id", [attn.id])).rows[0].id;
    await expect(produceProject(pid)).rejects.toThrow(/budget/);
    delete process.env.MONTHLY_BUDGET_USD;
  });
});
