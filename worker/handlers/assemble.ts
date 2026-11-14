import { assembleProject } from "../../src/lib/assemble";
import type { Job } from "../../src/lib/queue";

export async function assembleJob(job: Job) {
  const t = await assembleProject(job.payload.projectId, { jobId: job.id });
  return { duration: t.duration, segments: t.segments.length };
}
