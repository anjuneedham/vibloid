import { getPool } from "./db";
import { renderBlockers, generateScript, type Style } from "./scripts";
import { assembleProject } from "./assemble";
import { renderProject } from "./render";
import { buildPackaging } from "./packaging";
import { channelForProject } from "./channels";
import { assertProjectBudget } from "./budget";

const STYLE_FALLBACK: Style = "explained_simply";

async function stage(projectId: string, stage: string, extra: Record<string, unknown> = {}) {
  await getPool().query("update projects set pipeline = $2 where id=$1", [projectId, JSON.stringify({ stage, at: new Date().toISOString(), ...extra })]);
}

/**
 * Take a project from idea to "ready for your review" in one job: script -> (gates) -> voice+visuals -> final render -> packaging.
 * It STOPS, without error, whenever a human is needed (open fact-check items, policy violations, no title passing the promise check).
 * It never approves or uploads: that is always the review queue.
 */
export async function produceProject(projectId: string, jobId?: string) {
  const db = getPool();
  const p = (await db.query("select * from projects where id=$1", [projectId])).rows[0];
  if (!p) throw new Error("project not found");
  await assertProjectBudget(projectId, 0.1);

  let script = (await db.query("select * from scripts where project_id=$1 order by version desc limit 1", [projectId])).rows[0];
  if (!script) {
    await stage(projectId, "scripting");
    script = await generateScript(projectId, { style: (p.brief?.style ?? STYLE_FALLBACK) as Style, jobId });
  }
  const channel = await channelForProject(projectId);
  const blockers = renderBlockers(script.body, script.fact_check_items, channel);
  if (blockers.length) {
    await stage(projectId, "needs_review", { blockers });
    return { stage: "needs_review", blockers };
  }
  await stage(projectId, "assembling");
  await assembleProject(projectId, { jobId });
  await stage(projectId, "rendering");
  await renderProject(projectId, "final");
  await stage(projectId, "packaging");
  const pk = await buildPackaging(projectId, { jobId });
  if (!pk.chosen) { await stage(projectId, "needs_title", { note: "no title passed the promise-delivery check; edit the script or regenerate" }); return { stage: "needs_title" }; }
  await stage(projectId, "packaged");
  return { stage: "packaged", title: pk.chosen };
}
