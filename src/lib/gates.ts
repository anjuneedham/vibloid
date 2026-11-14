import { getPool } from "./db";
import { renderBlockers } from "./scripts";
import { channelForProject } from "./channels";
import { assertRenderable, type Rights } from "./rights";

/** Throws if the project must not be assembled/rendered/published yet. Single place for all render gates. */
export async function assertProjectRenderable(projectId: string) {
  const db = getPool();
  const p = (await db.query("select * from projects where id=$1", [projectId])).rows[0];
  if (!p) throw new Error("project not found");
  const s = (await db.query("select * from scripts where project_id=$1 order by version desc limit 1", [projectId])).rows[0];
  if (!s) throw new Error("render blocked: project has no script");
  const blockers = renderBlockers(s.body, s.fact_check_items, await channelForProject(projectId));
  if (blockers.length) throw new Error("render blocked: " + blockers.join("; "));
  const refs = (s.body.beats as any[]).map((b) => b.clip_ref).filter(Boolean);
  const clipIds = [...new Set([...(p.clip_ids as string[]), ...refs])];
  if (clipIds.length) {
    const rows = (await db.query("select so.rights_status from clips c join sources so on so.id=c.source_id where c.id = any($1)", [clipIds])).rows;
    assertRenderable(rows.map((r) => r.rights_status as Rights));
  }
  return { project: p, script: s };
}
