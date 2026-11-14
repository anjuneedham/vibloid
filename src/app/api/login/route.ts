import { checkPassword, makeToken, COOKIE } from "@/lib/auth";

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({ password: "" }));
  if (!checkPassword(String(password ?? ""))) return Response.json({ error: "bad password" }, { status: 401 });
  const res = Response.json({ ok: true });
  res.headers.append("set-cookie", `${COOKIE}=${makeToken()}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 14}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
  return res;
}
