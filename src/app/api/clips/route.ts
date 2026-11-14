import { requireOwner } from "@/lib/auth";
import { getPool } from "@/lib/db";

export async function GET(req: Request) {
  const denied = requireOwner(req); if (denied) return denied;
  const status = new URL(req.url).searchParams.get("status") ?? "accepted";
  const r = await getPool().query(
    `select c.*, s.title as source_title, s.rights_status from clips c join sources s on s.id=c.source_id where c.status=$1 order by c.created_at desc limit 200`, [status]);
  return Response.json({ clips: r.rows });
}
