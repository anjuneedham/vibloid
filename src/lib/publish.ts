import { getPool } from "./db";
import { getStorage } from "./storage";
import { renderBlockers } from "./scripts";
import { assertRenderable, type Rights } from "./rights";
import { DISCLAIMER } from "./packaging";
import { QUOTA_COST, QuotaError, reserveQuota, getYouTubeClient, type YouTubeClient } from "./youtube";
import { enqueue } from "./queue";

export type Checklist = { rights_ok: boolean; facts_resolved: boolean; disclaimer_present: boolean; no_unlicensed_audio: boolean; preview_watched: boolean };

/** Everything the server can verify itself. The client can never assert these. */
export async function computeChecklist(projectId: string): Promise<{ auto: Omit<Checklist, "preview_watched">; problems: string[] }> {
  const db = getPool();
  const p = (await db.query("select * from projects where id=$1", [projectId])).rows[0];
  const s = (await db.query("select * from scripts where project_id=$1 order by version desc limit 1", [projectId])).rows[0];
  const pk = (await db.query("select * from packaging where project_id=$1", [projectId])).rows[0];
  const problems: string[] = [];
  let facts = false, rights = false;
  if (s) { const b = renderBlockers(s.body, s.fact_check_items); facts = b.length === 0; if (!facts) problems.push(...b); } else problems.push("no script");
  try {
    const refs = s ? (s.body.beats as any[]).map((b) => b.clip_ref).filter(Boolean) : [];
    const ids = [...new Set([...(p?.clip_ids ?? []), ...refs])];
    const rows = ids.length ? (await db.query("select so.rights_status from clips c join sources so on so.id=c.source_id where c.id = any($1)", [ids])).rows : [];
    assertRenderable(rows.map((r) => r.rights_status as Rights)); rights = true;
  } catch (e) { problems.push((e as Error).message); }
  const disclaimer = !!pk?.description?.includes(DISCLAIMER);
  if (!disclaimer) problems.push("description is missing the financial disclaimer");
  const music = (await db.query("select license from assets where project_id=$1 and kind in ('music','image','thumbnail')", [projectId])).rows;
  const unlicensed = music.filter((a) => !a.license?.license || /unknown/i.test(a.license.license));
  if (!music.length || unlicensed.length) problems.push("an audio/image asset has no license on record");
  if (!pk?.chosen_title) problems.push("no title passed the promise-delivery check");
  return { auto: { rights_ok: rights, facts_resolved: facts, disclaimer_present: disclaimer, no_unlicensed_audio: music.length > 0 && !unlicensed.length }, problems };
}

export async function approveProject(projectId: string, o: { approvedBy: string; previewWatched: boolean; scheduledAt?: Date | null }) {
  const db = getPool();
  if (!o.approvedBy?.trim()) throw new Error("approvedBy is required");
  if (!o.previewWatched) throw new Error("you must confirm you watched the preview/final render");
  if (o.scheduledAt && o.scheduledAt.getTime() < Date.now() + 5 * 60_000) throw new Error("scheduled time must be at least 5 minutes in the future");
  const { auto, problems } = await computeChecklist(projectId);
  if (problems.length) throw new Error("cannot approve: " + problems.join("; "));
  const render = (await db.query("select * from renders where project_id=$1 and kind='final' order by created_at desc limit 1", [projectId])).rows[0];
  if (!render) throw new Error("cannot approve: no final render");
  const fresh = (await db.query("select greatest((select max(created_at) from scripts where project_id=$1), (select max(created_at) from assets where project_id=$1 and kind='timeline')) as t", [projectId])).rows[0].t;
  if (fresh && new Date(render.created_at) < new Date(fresh)) throw new Error("cannot approve: the final render is older than the latest script/timeline; render again");
  const checklist: Checklist = { ...auto, preview_watched: true };
  const r = await db.query(
    `insert into publish_queue (project_id, render_id, checklist, approved_by, approved_at, scheduled_at, status) values ($1,$2,$3,$4,now(),$5,'approved') returning *`,
    [projectId, render.id, JSON.stringify(checklist), o.approvedBy, o.scheduledAt ?? null],
  );
  await db.query("update projects set status='approved' where id=$1", [projectId]);
  await enqueue("upload_video", { queueId: r.rows[0].id }, { idempotencyKey: `upload:${r.rows[0].id}` });
  return r.rows[0];
}

/** The ONLY path to YouTube. Re-verifies approval from the database every time. */
export async function uploadApproved(queueId: string, client: YouTubeClient = getYouTubeClient()) {
  const db = getPool();
  const q = (await db.query("select * from publish_queue where id=$1", [queueId])).rows[0];
  if (!q) throw new Error("queue item not found");
  if (!q.approved_at || !q.approved_by) throw new Error("refusing to upload: item is not approved");
  if (q.youtube_video_id) return q; // already uploaded; idempotent
  if (!["approved", "uploading"].includes(q.status)) throw new Error(`refusing to upload: item is not approved (status ${q.status})`);
  const checklist = q.checklist as Checklist;
  if (!Object.values(checklist).every(Boolean)) throw new Error("refusing to upload: checklist incomplete");
  const { problems } = await computeChecklist(q.project_id);
  if (problems.length) throw new Error("refusing to upload: " + problems.join("; "));

  const pk = (await db.query("select * from packaging where project_id=$1", [q.project_id])).rows[0];
  const render = (await db.query("select * from renders where id=$1", [q.render_id])).rows[0];
  const thumb = (await db.query("select storage_key, meta from assets where project_id=$1 and kind='thumbnail' order by (meta->>'contrast')::numeric desc nulls last limit 1", [q.project_id])).rows[0];
  const storage = getStorage();

  await reserveQuota(QUOTA_COST.videosInsert + (thumb ? QUOTA_COST.thumbnailsSet : 0)); // throws QuotaError
  await db.query("update publish_queue set status='uploading', error=null where id=$1", [queueId]);
  try {
    const { videoId } = await client.upload(storage.localPath(render.storage_key), {
      title: pk.chosen_title, description: pk.description, tags: pk.tags, syntheticMedia: true,
      publishAt: q.scheduled_at ? new Date(q.scheduled_at) : undefined,
    });
    await db.query("update publish_queue set youtube_video_id=$2 where id=$1", [queueId, videoId]);
    if (thumb) await client.setThumbnail(videoId, storage.localPath(thumb.storage_key));
    const status = q.scheduled_at ? "scheduled" : "uploaded_private";
    const r = await db.query("update publish_queue set status=$2 where id=$1 returning *", [queueId, status]);
    await db.query("update projects set status=$2 where id=$1", [q.project_id, q.scheduled_at ? "scheduled" : "approved"]);
    return r.rows[0];
  } catch (e) {
    // Keep status 'uploading' so a retry is allowed; the job handler marks it failed once attempts are exhausted.
    await db.query("update publish_queue set error=$2 where id=$1", [queueId, String((e as Error).message).slice(0, 500)]);
    throw e;
  }
}

export { QuotaError };
