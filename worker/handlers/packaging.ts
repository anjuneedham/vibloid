import { buildPackaging } from "../../src/lib/packaging";
import type { Job } from "../../src/lib/queue";

export async function packagingJob(job: Job) {
  const r = await buildPackaging(job.payload.projectId, { jobId: job.id });
  return { chosen: r.chosen, thumbnails: r.concepts.length };
}
