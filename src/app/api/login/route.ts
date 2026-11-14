import { checkPassword, makeToken, COOKIE } from "@/lib/auth";
import { loginLimiter, clientIp } from "@/lib/ratelimit";

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (loginLimiter.blocked(ip)) return Response.json({ error: "too many attempts" }, { status: 429, headers: { "retry-after": String(loginLimiter.retryAfterS(ip)) } });
  const { password } = await req.json().catch(() => ({ password: "" }));
  if (!checkPassword(String(password ?? ""))) { loginLimiter.fail(ip); return Response.json({ error: "bad password" }, { status: 401 }); }
  loginLimiter.reset(ip);
  const res = Response.json({ ok: true });
  res.headers.append("set-cookie", `${COOKIE}=${makeToken()}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 14}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
  return res;
}
