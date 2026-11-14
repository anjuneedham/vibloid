import { getPool } from "./db";
import { DeferError } from "./queue";

export class BudgetExceededError extends DeferError {
  constructor(message: string, now = new Date()) { super(new Date(now.getTime() + 15 * 60_000), message); }
}
export const monthlyBudget = () => Number(process.env.MONTHLY_BUDGET_USD ?? 50);
export const perVideoBudget = () => Number(process.env.PER_VIDEO_BUDGET_USD ?? 3);

export async function monthSpend(): Promise<number> {
  const r = await getPool().query("select coalesce(sum(cost_usd),0) as t from job_costs where created_at >= date_trunc('month', now())");
  return Number(r.rows[0].t);
}
export async function projectSpend(projectId: string): Promise<number> {
  const r = await getPool().query("select coalesce(sum(cost_usd),0) as t from job_costs where project_id=$1", [projectId]);
  return Number(r.rows[0].t);
}

/**
 * HARD STOP. Throws (as a deferral, so no attempts are burned) when spending `estimateUsd` more would pass the monthly cap.
 * Raise MONTHLY_BUDGET_USD and the job resumes within ~15 minutes.
 */
export async function assertBudget(estimateUsd = 0, now = new Date()) {
  const spent = await monthSpend(), cap = monthlyBudget();
  if (spent + estimateUsd > cap) throw new BudgetExceededError(`monthly budget reached: $${spent.toFixed(2)} spent + $${estimateUsd.toFixed(2)} est. > $${cap.toFixed(2)} cap`, now);
}
export async function assertProjectBudget(projectId: string, estimateUsd = 0) {
  const spent = await projectSpend(projectId), cap = perVideoBudget();
  if (spent + estimateUsd > cap) throw new BudgetExceededError(`per-video budget reached: $${spent.toFixed(2)} + $${estimateUsd.toFixed(2)} > $${cap.toFixed(2)}`);
  await assertBudget(estimateUsd);
}
