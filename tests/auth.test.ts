import { describe, it, expect } from "vitest";
import { checkPassword, makeToken, verifyToken, requireOwner, COOKIE } from "../src/lib/auth";

describe("owner auth", () => {
  it("accepts only the right password", () => {
    expect(checkPassword("hunter2")).toBe(true);
    expect(checkPassword("nope")).toBe(false);
  });
  it("verifies tokens, rejects tampered and expired", () => {
    const t = makeToken(60);
    expect(verifyToken(t)).toBe(true);
    expect(verifyToken(t.replace(/.$/, "0"))).toBe(false);
    expect(verifyToken(t, Date.now() + 120_000)).toBe(false);
    expect(verifyToken(undefined)).toBe(false);
  });
  it("API guard blocks anonymous, allows owner", () => {
    expect(requireOwner(new Request("http://x"))?.status).toBe(401);
    const ok = new Request("http://x", { headers: { cookie: `${COOKIE}=${makeToken()}` } });
    expect(requireOwner(ok)).toBeNull();
  });
});
