import { describe, it, expect } from "vitest";
import { createResilient, wrapProvider, HttpError, CircuitOpenError, isRetryable } from "../src/lib/resilience";
import { DeferError } from "../src/lib/queue";

const fast = { sleep: async () => {}, random: () => 0.5 };

describe("resilience", () => {
  it("classifies errors", () => {
    expect(isRetryable(new HttpError(429, "x"))).toBe(true);
    expect(isRetryable(new HttpError(503, "x"))).toBe(true);
    expect(isRetryable(new HttpError(400, "x"))).toBe(false);
    expect(isRetryable(new HttpError(401, "x"))).toBe(false);
    expect(isRetryable(Object.assign(new Error("boom"), { code: "ECONNRESET" }))).toBe(true);
    expect(isRetryable(new Error("fetch failed"))).toBe(true);
    expect(isRetryable(new Error("validation failed"))).toBe(false);
  });

  it("retries transient failures then succeeds", async () => {
    let n = 0;
    const r = createResilient("t", fast);
    expect(await r(async () => { if (++n < 3) throw new HttpError(503, "down"); return "ok"; })).toBe("ok");
    expect(n).toBe(3);
  });

  it("does not retry client errors and does not trip the breaker", async () => {
    let n = 0;
    const r = createResilient("t", { ...fast, failureThreshold: 1 });
    await expect(r(async () => { n++; throw new HttpError(400, "bad"); })).rejects.toThrow("bad");
    expect(n).toBe(1);
    expect(r.state().open).toBe(false);
  });

  it("honors Retry-After", async () => {
    const waits: number[] = [];
    const r = createResilient("t", { retries: 1, sleep: async (ms) => { waits.push(ms); } });
    let n = 0;
    await r(async () => { if (++n < 2) throw new HttpError(429, "slow down", 7); return 1; });
    expect(waits).toEqual([7000]);
  });

  it("opens the circuit after repeated failures, defers (not fails) while open, then recovers", async () => {
    let t = 1_000_000, calls = 0;
    const r = createResilient("svc", { retries: 0, failureThreshold: 3, cooldownMs: 60_000, now: () => t, ...fast });
    for (let i = 0; i < 3; i++) await expect(r(async () => { calls++; throw new HttpError(500, "x"); })).rejects.toThrow();
    expect(calls).toBe(3);
    const err = await r(async () => { calls++; return "never"; }).catch((e) => e);
    expect(err).toBeInstanceOf(CircuitOpenError);
    expect(err).toBeInstanceOf(DeferError); // jobs are postponed, not burned
    expect(calls).toBe(3);
    t += 61_000;
    expect(await r(async () => "back")).toBe("back");
    expect(r.state().failures).toBe(0);
  });

  it("wrapProvider wraps methods, passes data through, and supports per-method overrides", async () => {
    let up = 0, get = 0;
    const p = { name: "p", async get() { if (++get < 2) throw new HttpError(502, "x"); return "v"; }, async upload() { up++; throw new HttpError(502, "x"); } };
    const w = wrapProvider("p", p, fast, { upload: { retries: 0 } });
    expect(w.name).toBe("p");
    expect(await w.get()).toBe("v");
    await expect(w.upload()).rejects.toThrow();
    expect(up).toBe(1); // non-idempotent call is never auto-retried
  });
});
