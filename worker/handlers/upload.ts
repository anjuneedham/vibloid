import { uploadApproved } from "../../src/lib/publish";
import { getPool } from "../../src/lib/db";
import { DeferError, type Job } from "../../src/lib/queue";

export async function uploadJob(job: Job) {
  try {
    const r = await uploadApproved(job.payload.queueId);
    return { status: r.status, videoId: r.youtube_video_id };
  } catch (e) {
    if (!(e instanceof DeferError) && job.attempts >= job.max_attempts) {
      await getPool().query("update publish_queue set status='failed', error=$2 where id=$1 and youtube_video_id is null", [job.payload.queueId, (e as Error).message.slice(0, 500)]);
    }
    throw e;
  }
}
