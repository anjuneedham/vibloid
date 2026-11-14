/** Best-effort in-memory limiter (per server instance). Good enough to blunt password guessing on a single-owner app. */
export class FailureLimiter {
  private hits = new Map<string, number[]>();
  constructor(private max = 5, private windowMs = 15 * 60_000, private now: () => number = Date.now) {}
  private recent(key: string) {
    const t = this.now() - this.windowMs;
    const arr = (this.hits.get(key) ?? []).filter((x) => x > t);
    this.hits.set(key, arr);
    return arr;
  }
  blocked(key: string) { return this.recent(key).length >= this.max; }
  retryAfterS(key: string) { const a = this.recent(key); return a.length ? Math.ceil((a[0] + this.windowMs - this.now()) / 1000) : 0; }
  fail(key: string) { this.recent(key).push(this.now()); }
  reset(key: string) { this.hits.delete(key); }
}
export const loginLimiter = new FailureLimiter();
export const clientIp = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
