import { DeferError } from "./queue";

export class HttpError extends Error {
  constructor(public status: number, message: string, public retryAfterS?: number) { super(message); }
}

/** Build an HttpError from a failed fetch Response, honoring Retry-After. */
export async function httpError(res: Response, label: string) {
  const ra = Number(res.headers.get("retry-after"));
  const body = (await res.text().catch(() => "")).slice(0, 300);
  return new HttpError(res.status, `${label} ${res.status}: ${body}`, Number.isFinite(ra) && ra > 0 ? ra : undefined);
}

export class CircuitOpenError extends DeferError {
  constructor(public provider: string, until: Date) { super(until, `circuit open for ${provider}; retrying later`); }
}

const NET_CODES = new Set(["ECONNRESET", "ETIMEDOUT", "ECONNREFUSED", "EAI_AGAIN", "EPIPE", "UND_ERR_SOCKET", "UND_ERR_CONNECT_TIMEOUT"]);
export function isRetryable(e: any): boolean {
  const s = e?.status ?? e?.statusCode;
  if (typeof s === "number") return s === 408 || s === 425 || s === 429 || (s >= 500 && s !== 501);
  const code = e?.code ?? e?.cause?.code;
  if (code && NET_CODES.has(code)) return true;
  return /fetch failed|network|socket hang up|timed out/i.test(String(e?.message ?? ""));
}

export type ResilienceOpts = {
  retries?: number; baseMs?: number; maxMs?: number;
  failureThreshold?: number; cooldownMs?: number;
  sleep?: (ms: number) => Promise<void>; now?: () => number; random?: () => number;
};

export function createResilient(name: string, o: ResilienceOpts = {}) {
  const retries = o.retries ?? 3, baseMs = o.baseMs ?? 500, maxMs = o.maxMs ?? 30_000;
  const threshold = o.failureThreshold ?? 5, cooldown = o.cooldownMs ?? 60_000;
  const sleep = o.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
  const now = o.now ?? Date.now, rnd = o.random ?? Math.random;
  let failures = 0, openUntil = 0;
  const state = () => ({ failures, open: now() < openUntil });

  async function call<T>(fn: () => Promise<T>): Promise<T> {
    if (now() < openUntil) throw new CircuitOpenError(name, new Date(openUntil));
    for (let attempt = 0; ; attempt++) {
      try {
        const out = await fn();
        failures = 0;
        return out;
      } catch (e: any) {
        if (e instanceof DeferError) throw e;
        if (!isRetryable(e)) throw e; // our fault (4xx etc.): do not retry, do not trip the breaker
        if (attempt >= retries) {
          if (++failures >= threshold) openUntil = now() + cooldown;
          throw e;
        }
        const backoff = Math.min(maxMs, baseMs * 2 ** attempt);
        const wait = e.retryAfterS ? Math.min(maxMs, e.retryAfterS * 1000) : backoff / 2 + rnd() * (backoff / 2); // jitter
        await sleep(wait);
      }
    }
  }
  return Object.assign(call, { state });
}

/** Wrap every method of a provider object. `perMethod` overrides options (e.g. never auto-retry a non-idempotent upload). */
export function wrapProvider<T extends object>(name: string, provider: T, o: ResilienceOpts = {}, perMethod: Record<string, ResilienceOpts> = {}): T {
  const shared = createResilient(name, o);
  const cache = new Map<string, ReturnType<typeof createResilient>>();
  return new Proxy(provider, {
    get(target, prop, receiver) {
      const v = Reflect.get(target, prop, receiver);
      if (typeof v !== "function" || typeof prop !== "string") return v;
      const runner = perMethod[prop] ? (cache.get(prop) ?? cache.set(prop, createResilient(`${name}.${prop}`, { ...o, ...perMethod[prop] })).get(prop)!) : shared;
      return (...args: unknown[]) => runner(() => v.apply(target, args));
    },
  });
}
