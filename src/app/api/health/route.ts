import { requireOwner } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(req: Request) {
  const denied = requireOwner(req);
  if (denied) return denied;
  const r = await query("select now() as now");
  return Response.json({ ok: true, db: r.rows[0].now });
}
