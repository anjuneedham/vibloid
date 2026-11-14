import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { migrate } from "../scripts/migrate";
import { getPool, closePool } from "../src/lib/db";
import { MockLLM } from "../src/lib/llm";
import { createProject, generateScript, resolveFactItem, renderBlockers, lintScript, editScript, diffScripts, wordCount, ScriptBody } from "../src/lib/scripts";

const good = {
  hook: "Your savings account is quietly losing money.",
  promise: "In 45 seconds you'll see why inflation matters and one habit that helps.",
  beats: [
    { narration: "Inflation averaged about 3 percent over the last century in the US [CITATION NEEDED].", visual_query: "grocery prices" },
    { narration: "That means 1000 dollars buys less every year.", visual_query: "piggy bank" },
    { narration: "Automate a transfer into a low-cost index fund on payday.", visual_query: "phone banking app" },
  ],
  cta: "Follow for one money idea a day.",
  claims: [{ text: "US inflation averaged ~3% over the last century", needs_source: true }],
};

let projectId: string;
beforeAll(async () => {
  await getPool().query("drop schema public cascade; create schema public;");
  await migrate();
  projectId = (await createProject({ title: "Inflation", format: "short", topic: "inflation" })).id;
});
afterAll(closePool);

describe("script generation and gates", () => {
  it("generates a script with fact_check_items and blocks render until resolved", async () => {
    const llm = new MockLLM(() => good);
    const s = await generateScript(projectId, { style: "explained_simply", llm });
    expect(s.fact_check_items.length).toBe(1);
    expect(renderBlockers(s.body, s.fact_check_items).length).toBeGreaterThan(0);
    const s2 = await resolveFactItem(s.id, s.fact_check_items[0].id, { source: "https://example.org/cpi (BLS data)" });
    expect(s2.version).toBe(2);
    expect(JSON.stringify(s2.body)).not.toContain("CITATION NEEDED");
    expect(renderBlockers(s2.body, s2.fact_check_items)).toEqual([]);
  });

  it("resolve requires a source", async () => {
    const s = (await getPool().query("select * from scripts where version=1")).rows[0];
    await expect(resolveFactItem(s.id, s.fact_check_items[0].id, { source: " " })).rejects.toThrow(/source/);
  });

  it("flags banned financial claims and cannot be resolved by citation", async () => {
    const bad = { ...good, claims: [], beats: [...good.beats.slice(0, 2).map((b) => ({ ...b, narration: b.narration.replace(" [CITATION NEEDED]", "") })), { narration: "This is guaranteed returns with zero effort, risk-free.", visual_query: "money" }] };
    expect(lintScript(bad as any)).toEqual(expect.arrayContaining(["guaranteed returns", "risk-free claim"]));
    const s = await generateScript(projectId, { style: "myth_vs_reality", llm: new MockLLM(() => bad) });
    const policy = s.fact_check_items.find((i: any) => i.kind === "policy");
    expect(policy).toBeTruthy();
    await expect(resolveFactItem(s.id, policy.id, { source: "x" })).rejects.toThrow(/editing/);
    expect(renderBlockers(s.body, s.fact_check_items).some((b) => b.includes("policy"))).toBe(true);
  });

  it("versions are diffable", async () => {
    const latestResolved = (await getPool().query("select * from scripts where version=2 and project_id=$1", [projectId])).rows[0];
    const edited = { ...latestResolved.body, hook: "Your cash is quietly shrinking." };
    const s = await editScript(projectId, ScriptBody.parse(edited));
    const diff = diffScripts(latestResolved.body, s.body);
    expect(diff).toEqual([{ part: "hook", before: "Your savings account is quietly losing money.", after: "Your cash is quietly shrinking." }]);
    expect(wordCount(s.body)).toBeGreaterThan(30);
  });

  it("edit directly after resolving keeps the resolved claim resolved", async () => {
    const pid = (await createProject({ title: "Inflation 2", format: "short" })).id;
    const s1 = await generateScript(pid, { style: "explained_simply", llm: new MockLLM(() => good) });
    const s2 = await resolveFactItem(s1.id, s1.fact_check_items[0].id, { source: "BLS CPI" });
    const s3 = await editScript(pid, ScriptBody.parse({ ...s2.body, hook: "Cash quietly shrinks." }));
    expect(s3.fact_check_items.find((i: any) => i.kind === "claim").resolved).toBe(true);
    expect(renderBlockers(s3.body, s3.fact_check_items)).toEqual([]);
  });
});
