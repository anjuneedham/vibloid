import { requireOwner } from "@/lib/auth";
import { getPool } from "@/lib/db";

export async function GET(req: Request) {
  const denied = requireOwner(req); if (denied) return denied;
  const r = await getPool().query(`select q.*, p.title as project_title, k.chosen_title from publish_queue q join projects p on p.id=q.project_id left join packaging k on k.project_id=q.project_id order by q.created_at desc limit 100`);
  return Response.json({ items: r.rows });
}
