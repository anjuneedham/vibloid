import crypto from "node:crypto";

const COOKIE = "vibloid_session";
export { COOKIE };

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) throw new Error("SESSION_SECRET must be set (16+ chars)");
  return s;
}

function sign(v: string) {
  return crypto.createHmac("sha256", secret()).update(v).digest("hex");
}

export function checkPassword(input: string): boolean {
  const expected = process.env.OWNER_PASSWORD;
  if (!expected) return false;
  const a = Buffer.from(input), b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function makeToken(ttlSeconds = 60 * 60 * 24 * 14, now = Date.now()) {
  const exp = Math.floor(now / 1000) + ttlSeconds;
  return `${exp}.${sign(String(exp))}`;
}

export function verifyToken(token: string | undefined | null, now = Date.now()): boolean {
  if (!token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig) return false;
  const good = sign(exp);
  if (sig.length !== good.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return false;
  return Number(exp) > Math.floor(now / 1000);
}

export function cookieFromHeader(header: string | null): string | undefined {
  return header?.split(";").map((c) => c.trim()).find((c) => c.startsWith(COOKIE + "="))?.slice(COOKIE.length + 1);
}

/** Use at the top of every API route. Returns a 401 Response when not the owner. */
export function requireOwner(req: Request): Response | null {
  return verifyToken(cookieFromHeader(req.headers.get("cookie"))) ? null : Response.json({ error: "unauthorized" }, { status: 401 });
}
