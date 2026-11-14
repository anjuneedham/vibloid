import { requireOwner } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { renderBlockers } from "@/lib/scripts";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = requireOwner(req); if (denied) return denied;
  const { id } = await params;
  const db = getPool();
  const project = (await db.query("select * from projects where id=$1", [id])).rows[0];
  if (!project) return Response.json({ error: "not found" }, { status: 404 });
  const script = (await db.query("select * from scripts where project_id=$1 order by version desc limit 1", [id])).rows[0] ?? null;
  const [renders, packaging, assets, costs, queue] = await Promise.all([
    db.query("select * from renders where project_id=$1 order by created_at desc", [id]),
    db.query("select * from packaging where project_id=$1", [id]),
    db.query("select id,kind,storage_key,license,meta from assets where project_id=$1 order by created_at", [id]),
    db.query("select coalesce(sum(cost_usd),0) as total from job_costs where project_id=$1", [id]),
    db.query("select * from publish_queue where project_id=$1 order by created_at desc limit 1", [id]),
  ]);
  return Response.json({
    project, script, blockers: script ? renderBlockers(script.body, script.fact_check_items) : ["no script"],
    renders: renders.rows, packaging: packaging.rows[0] ?? null, assets: assets.rows, costUsd: Number(costs.rows[0].total), queue: queue.rows[0] ?? null,
  });
}
