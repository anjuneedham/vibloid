import { selectClips } from "../../src/lib/clips";
import type { Job } from "../../src/lib/queue";

export async function selectClipsJob(job: Job) {
  const n = await selectClips(job.payload.sourceId, job.payload.format ?? "short", { feedback: job.payload.feedback, jobId: job.id });
  return { clips: n };
}
