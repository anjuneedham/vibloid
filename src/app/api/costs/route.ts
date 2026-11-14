import { requireOwner } from "@/lib/auth";
import { getPool } from "@/lib/db";

export async function GET(req: Request) {
  const denied = requireOwner(req); if (denied) return denied;
  const db = getPool();
  const budget = Number(process.env.MONTHLY_BUDGET_USD ?? 50);
  const month = Number((await db.query("select coalesce(sum(cost_usd),0) as t from job_costs where created_at >= date_trunc('month', now())")).rows[0].t);
  const perVideo = (await db.query(`select p.id, p.title, p.format, coalesce(sum(c.cost_usd),0)::float as cost_usd from projects p left join job_costs c on c.project_id=p.id group by p.id order by p.created_at desc limit 50`)).rows;
  const byProvider = (await db.query(`select provider, unit, sum(quantity)::float as quantity, sum(cost_usd)::float as cost_usd from job_costs where created_at >= date_trunc('month', now()) group by provider, unit order by 4 desc`)).rows;
  return Response.json({ budget, month, pct: budget ? month / budget : 0, alert: month >= budget * 0.8 ? (month >= budget ? "over" : "warning") : null, perVideo, byProvider });
}
