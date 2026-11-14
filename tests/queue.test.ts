import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { migrate } from "../scripts/migrate";
import { getPool, closePool } from "../src/lib/db";
import { enqueue, claimJob, completeJob, failJob, drain } from "../src/lib/queue";

beforeAll(async () => {
  await getPool().query("drop schema public cascade; create schema public;");
  await migrate();
});
afterAll(closePool);

describe("job queue", () => {
  it("processes 100 jobs exactly once across 3 concurrent workers", async () => {
    for (let i = 0; i < 100; i++) await enqueue("count", { i });
    const seen: number[] = [];
    const handlers = { count: async (j: any) => { seen.push(j.payload.i); await new Promise((r) => setTimeout(r, 2)); } };
    const counts = await Promise.all(["w1", "w2", "w3"].map((w) => drain(w, handlers)));
    expect(counts.reduce((a, b) => a + b, 0)).toBe(100);
    expect(new Set(seen).size).toBe(100);
    expect(counts.filter((c) => c > 0).length).toBeGreaterThan(1);
    const r = await getPool().query("select count(*) from jobs where state='done'");
    expect(Number(r.rows[0].count)).toBe(100);
  });

  it("is idempotent on idempotency_key", async () => {
    const a = await enqueue("x", {}, { idempotencyKey: "k1" });
    const b = await enqueue("x", {}, { idempotencyKey: "k1" });
    expect(a).toBe(b);
  });

  it("retries with backoff then dead-letters", async () => {
    await getPool().query("delete from jobs");
    await enqueue("boom", {}, { maxAttempts: 2 });
    let job = (await claimJob("w"))!;
    await failJob(job, new Error("nope"));
    expect(await claimJob("w")).toBeNull(); // backoff: not due yet
    await getPool().query("update jobs set run_after = now()");
    job = (await claimJob("w"))!;
    expect(job.attempts).toBe(2);
    await failJob(job, new Error("nope again"));
    const r = await getPool().query("select state, error from jobs");
    expect(r.rows[0].state).toBe("dead");
  });
});
