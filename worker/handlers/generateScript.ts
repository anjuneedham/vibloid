import { generateScript, type Style } from "../../src/lib/scripts";
import type { Job } from "../../src/lib/queue";

export async function generateScriptJob(job: Job) {
  const s = await generateScript(job.payload.projectId, { style: (job.payload.style ?? "explained_simply") as Style, feedback: job.payload.feedback, jobId: job.id });
  return { scriptId: s.id, version: s.version };
}
