import { COOKIE } from "@/lib/auth";
export async function POST() {
  const res = Response.json({ ok: true });
  res.headers.append("set-cookie", `${COOKIE}=; Path=/; HttpOnly; Max-Age=0`);
  return res;
}
