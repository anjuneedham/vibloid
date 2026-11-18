import { requireOwner } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { computeInsights, yppProgress } from "@/lib/analytics";

export async function GET(req: Request) {
  const denied = requireOwner(req); if (denied) return denied;
  const reports = (await getPool().query("select * from weekly_reports order by week_start desc limit 4")).rows;
  return Response.json({ insights: await computeInsights(28), ypp: await yppProgress(), reports });
}
