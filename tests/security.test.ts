import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { isPrivateIp, assertSafeUrl, safeLookup } from "../src/lib/download";
import { FailureLimiter } from "../src/lib/ratelimit";
import { scanText } from "../scripts/scan-secrets";
import { LocalStorage } from "../src/lib/storage";

describe("SSRF protection", () => {
  it.each(["127.0.0.1", "10.1.2.3", "172.16.0.1", "172.31.255.255", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "::1", "fd12::1", "fe80::1", "::ffff:127.0.0.1", "224.0.0.1"])("%s is private", (ip) => {
    expect(isPrivateIp(ip)).toBe(true);
  });
  it.each(["8.8.8.8", "1.1.1.1", "93.184.216.34", "172.32.0.1", "2606:4700:4700::1111"])("%s is public", (ip) => {
    expect(isPrivateIp(ip)).toBe(false);
  });
  it("rejects bad schemes and literal private hosts at intake", () => {
    process.env.ALLOW_PRIVATE_URLS = "0";
    expect(() => assertSafeUrl("file:///etc/passwd")).toThrow(/http/);
    expect(() => assertSafeUrl("ftp://x/y")).toThrow();
    expect(() => assertSafeUrl("http://169.254.169.254/latest/meta-data")).toThrow(/private/);
    expect(() => assertSafeUrl("http://localhost:3000/")).toThrow(/private/);
    expect(() => assertSafeUrl("http://[::1]/")).toThrow(/private/);
    expect(() => assertSafeUrl("https://example.com/v.mp4")).not.toThrow();
  });
  it("blocks DNS names that RESOLVE to private IPs (rebinding / redirect to internal)", async () => {
    process.env.ALLOW_PRIVATE_URLS = "0";
    const evil: any = (_h: string, _o: any, cb: any) => cb(null, [{ address: "10.0.0.5", family: 4 }]);
    const good: any = (_h: string, _o: any, cb: any) => cb(null, [{ address: "93.184.216.34", family: 4 }]);
    await expect(new Promise((res, rej) => safeLookup(evil)("evil.example", {}, (e: any, a: any) => (e ? rej(e) : res(a))))).rejects.toThrow(/private/);
    await expect(new Promise((res, rej) => safeLookup(good)("ok.example", {}, (e: any, a: any) => (e ? rej(e) : res(a))))).resolves.toBe("93.184.216.34");
  });
});

describe("login rate limit", () => {
  it("blocks after 5 failures in the window and recovers", () => {
    let t = 0;
    const l = new FailureLimiter(5, 900_000, () => t);
    for (let i = 0; i < 5; i++) { expect(l.blocked("ip")).toBe(false); l.fail("ip"); }
    expect(l.blocked("ip")).toBe(true);
    expect(l.blocked("other")).toBe(false);
    t = 900_001;
    expect(l.blocked("ip")).toBe(false);
  });
});

describe("storage", () => {
  it("rejects path traversal keys", () => {
    const s = new LocalStorage("/tmp/vibloid-test-root");
    expect(() => s.localPath("../etc/passwd")).toThrow(/invalid/);
    expect(() => s.localPath("a/../../b")).toThrow(/invalid/);
    expect(() => s.localPath("ok/file.mp4")).not.toThrow();
  });
});

describe("every API route is owner-protected", () => {
  const PUBLIC = new Set(["login/route.ts", "logout/route.ts"]);
  const walk = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  const root = path.resolve("src/app/api");
  const routes = walk(root).filter((f) => f.endsWith("route.ts"));
  it("found routes", () => expect(routes.length).toBeGreaterThan(15));
  for (const f of routes) {
    const rel = path.relative(root, f);
    if (PUBLIC.has(rel)) continue;
    it(`${rel} calls requireOwner in every handler`, () => {
      const src = fs.readFileSync(f, "utf8");
      const handlers = [...src.matchAll(/export async function (GET|POST|PATCH|PUT|DELETE)\b/g)].length;
      const guards = [...src.matchAll(/requireOwner\(req\)/g)].length;
      expect(handlers).toBeGreaterThan(0);
      expect(guards).toBeGreaterThanOrEqual(handlers);
    });
  }
});

describe("secret scanner", () => {
  it("flags real-looking secrets and ignores placeholders", () => {
    expect(scanText("key = sk-ant-api03-abcdefghijklmnopqrstuvwxyz0123")).toContain("Anthropic API key");
    expect(scanText("AKIAABCDEFGHIJKLMNOP")).toContain("AWS access key id");
    expect(scanText("-----BEGIN PRIVATE KEY-----")).toContain("Private key block");
    expect(scanText("postgres://neondb_owner:Xk29sdkj2k3@ep-cool-123.us-east-2.aws.neon.tech/neondb")).toContain("Postgres URL with password");
    expect(scanText("DATABASE_URL=postgres://user:pass@ep-xxx.neon.tech/neondb")).toEqual([]);
    expect(scanText("postgres://postgres@localhost:5433/vibloid")).toEqual([]);
    expect(scanText("ANTHROPIC_API_KEY=")).toEqual([]);
  });
});
