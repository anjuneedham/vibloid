import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { migrate } from "../scripts/migrate";
import { getPool, closePool } from "../src/lib/db";
import { setStorage, LocalStorage } from "../src/lib/storage";
import { MockLLM } from "../src/lib/llm";
import { createProject, generateScript, resolveFactItem } from "../src/lib/scripts";
import { assembleProject } from "../src/lib/assemble";
import { renderProject } from "../src/lib/render";
import { buildPackaging } from "../src/lib/packaging";
import { approveProject, uploadApproved, computeChecklist } from "../src/lib/publish";
import { MockYouTubeClient, pacificDay, nextQuotaReset, reserveQuota, QuotaError, quotaUsed } from "../src/lib/youtube";
import { encrypt, decrypt } from "../src/lib/secrets";
import { enqueue, claimJob, failJob } from "../src/lib/queue";

const script = {
  hook: "Stop confusing income with wealth right now.", promise: "Here are four habits that build real wealth over time.",
  beats: [1, 2, 3, 4].map((i) => ({ narration: `Habit ${i}: pay yourself first and automate it every month.`, visual_query: `money ${i}` })),
  cta: "Follow for more.", claims: [],
};
const packLLM = () => new MockLLM((sys) => sys.includes("strict editor")
  ? { results: [{ title: "4 habits that quietly build wealth", delivers: true, issues: [] }] }
  : { titles: [{ title: "a" }, { title: "b" }, { title: "c" }], top3: [{ title: "4 habits that quietly build wealth", reasoning: "r" }], description: "Four habits.", tags: ["money"],
      thumbnail_concepts: [{ text: "PAY YOURSELF FIRST", subject_query: "coins", layout: "left" }] });

let tmp: string;
async function readyProject(title = "P") {
  const pid = (await createProject({ title, format: "short" })).id;
  await generateScript(pid, { style: "seven_habits", llm: new MockLLM(() => script) });
  await assembleProject(pid);
  await renderProject(pid, "final");
  await buildPackaging(pid, { llm: packLLM() });
  return pid;
}
const future = () => new Date(Date.now() + 3600_000);

beforeAll(async () => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "vpub-"));
  setStorage(new LocalStorage(tmp));
  await getPool().query("drop schema public cascade; create schema public;");
  await migrate();
});
afterAll(async () => { await closePool(); fs.rmSync(tmp, { recursive: true, force: true }); });
beforeEach(async () => { await getPool().query("delete from quota_usage"); });

describe("review gate", () => {
  it("approves a clean project, records who/when, and queues the upload", async () => {
    const pid = await readyProject();
    const { auto, problems } = await computeChecklist(pid);
    expect(problems).toEqual([]);
    expect(Object.values(auto).every(Boolean)).toBe(true);
    const item = await approveProject(pid, { approvedBy: "owner", previewWatched: true });
    expect(item.approved_at).toBeTruthy();
    expect(item.checklist.preview_watched).toBe(true);
    expect((await getPool().query("select count(*) from jobs where type='upload_video'")).rows[0].count).toBe("1");
  });

  it("refuses approval without preview confirmation, with problems, or with a stale render", async () => {
    const pid = await readyProject("P2");
    await expect(approveProject(pid, { approvedBy: "owner", previewWatched: false })).rejects.toThrow(/watched/);
    await expect(approveProject(pid, { approvedBy: "owner", previewWatched: true, scheduledAt: new Date(Date.now() + 1000) })).rejects.toThrow(/5 minutes/);
    // edit the script after rendering => render is stale
    const s = (await getPool().query("select * from scripts where project_id=$1 order by version desc limit 1", [pid])).rows[0];
    await getPool().query("insert into scripts (project_id,version,body,fact_check_items) values ($1,$2,$3,'[]')", [pid, s.version + 1, JSON.stringify({ ...s.body, hook: "New hook entirely." })]);
    await expect(approveProject(pid, { approvedBy: "owner", previewWatched: true })).rejects.toThrow(/older than the latest/);
  });

  it("refuses when facts are unresolved", async () => {
    const pid = (await createProject({ title: "F", format: "short" })).id;
    const withStat = { ...script, beats: [{ ...script.beats[0], narration: "Prices rose 3 percent [CITATION NEEDED]." }, ...script.beats.slice(1)], claims: [{ text: "3%", needs_source: true }] };
    const s = await generateScript(pid, { style: "myth_vs_reality", llm: new MockLLM(() => withStat) });
    const c = await computeChecklist(pid);
    expect(c.auto.facts_resolved).toBe(false);
    await expect(approveProject(pid, { approvedBy: "owner", previewWatched: true })).rejects.toThrow(/cannot approve/);
    void resolveFactItem; void s;
  });
});

describe("uploader safety", () => {
  it("an unapproved item can never reach the uploader", async () => {
    const pid = await readyProject("P3");
    const client = new MockYouTubeClient();
    const q = (await getPool().query("insert into publish_queue (project_id, status) values ($1,'pending') returning id", [pid])).rows[0];
    await expect(uploadApproved(q.id, client)).rejects.toThrow(/not approved/);
    expect(client.uploads.length).toBe(0);
    // the database itself also refuses to advance an unapproved row
    await expect(getPool().query("update publish_queue set status='uploading' where id=$1", [q.id])).rejects.toThrow(/publish_requires_approval/);
    await expect(getPool().query("insert into publish_queue (project_id,status) values ($1,'published')", [pid])).rejects.toThrow();
  });

  it("uploads an approved item privately with synthetic-media disclosure and thumbnail", async () => {
    const pid = await readyProject("P4");
    const item = await approveProject(pid, { approvedBy: "owner", previewWatched: true });
    const client = new MockYouTubeClient();
    const done = await uploadApproved(item.id, client);
    expect(done.status).toBe("uploaded_private");
    expect(done.youtube_video_id).toBe("mock_1");
    expect(client.uploads[0].meta.syntheticMedia).toBe(true);
    expect(client.uploads[0].meta.publishAt).toBeUndefined();
    expect(client.uploads[0].meta.description).toContain("not financial");
    expect(client.thumbs).toEqual(["mock_1"]);
    expect(await quotaUsed()).toBe(1650);
    // idempotent: a second call does not upload again
    await uploadApproved(item.id, client);
    expect(client.uploads.length).toBe(1);
  });

  it("schedules when scheduled_at is set", async () => {
    const pid = await readyProject("P5");
    const item = await approveProject(pid, { approvedBy: "owner", previewWatched: true, scheduledAt: future() });
    const client = new MockYouTubeClient();
    const done = await uploadApproved(item.id, client);
    expect(done.status).toBe("scheduled");
    expect(client.uploads[0].meta.publishAt).toBeInstanceOf(Date);
  });

  it("rejects a tampered checklist", async () => {
    const pid = await readyProject("P6");
    const item = await approveProject(pid, { approvedBy: "owner", previewWatched: true });
    await getPool().query("update publish_queue set checklist = checklist || '{\"rights_ok\": false}' where id=$1", [item.id]);
    await expect(uploadApproved(item.id, new MockYouTubeClient())).rejects.toThrow(/checklist/);
  });

  it("re-verifies gates at upload time (script changed after approval)", async () => {
    const pid = await readyProject("P7");
    const item = await approveProject(pid, { approvedBy: "owner", previewWatched: true });
    const s = (await getPool().query("select * from scripts where project_id=$1 order by version desc limit 1", [pid])).rows[0];
    const bad = { ...s.body, hook: "This is guaranteed returns for everyone." };
    await getPool().query("insert into scripts (project_id,version,body,fact_check_items) values ($1,$2,$3,'[]')", [pid, s.version + 1, JSON.stringify(bad)]);
    const client = new MockYouTubeClient();
    await expect(uploadApproved(item.id, client)).rejects.toThrow(/refusing to upload/);
    expect(client.uploads.length).toBe(0);
  });
});

describe("quota", () => {
  it("computes the Pacific day and next reset", () => {
    expect(pacificDay(new Date("2026-11-14T07:30:00Z"))).toBe("2026-11-13"); // 23:30 PST the day before
    expect(nextQuotaReset(new Date("2026-11-14T07:30:00Z")).toISOString()).toBe("2026-11-14T08:00:00.000Z");
  });
  it("never overspends: atomic reservation throws QuotaError and defers instead of failing", async () => {
    process.env.YOUTUBE_DAILY_QUOTA = "3300";
    await reserveQuota(1650); await reserveQuota(1650);
    await expect(reserveQuota(1650)).rejects.toBeInstanceOf(QuotaError);
    expect(await quotaUsed()).toBe(3300);
    const pid = await readyProject("P8");
    const item = await approveProject(pid, { approvedBy: "owner", previewWatched: true });
    const client = new MockYouTubeClient();
    await getPool().query("delete from jobs where type='upload_video' and payload->>'queueId' <> $1", [item.id]); // other tests' jobs
    const jobId = (await getPool().query("select id from jobs where payload->>'queueId'=$1", [item.id])).rows[0].id;
    const job = (await claimJob("w", ["upload_video"]))!;
    expect(job.id).toBe(jobId);
    try { await uploadApproved(item.id, client); } catch (e) { await failJob(job, e); }
    expect(client.uploads.length).toBe(0);
    const j = (await getPool().query("select state, attempts, run_after from jobs where id=$1", [jobId])).rows[0];
    expect(j.state).toBe("queued");
    expect(j.attempts).toBe(0); // deferral does not burn an attempt
    expect(new Date(j.run_after).getTime()).toBeGreaterThan(Date.now());
    delete process.env.YOUTUBE_DAILY_QUOTA;
  });
});

describe("secrets", () => {
  it("round-trips and detects tampering", () => {
    const e = encrypt("refresh-token-123");
    expect(e).not.toContain("refresh-token");
    expect(decrypt(e)).toBe("refresh-token-123");
    const parts = e.split("."); parts[2] = Buffer.from("garbage!!").toString("base64");
    expect(() => decrypt(parts.join("."))).toThrow();
  });
});
