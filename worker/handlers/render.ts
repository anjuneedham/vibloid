import { renderProject } from "../../src/lib/render";
import type { Job } from "../../src/lib/queue";

export async function renderJob(job: Job) {
  const r = await renderProject(job.payload.projectId, job.payload.kind ?? "final");
  return { renderId: r.id, reused: r.reused, duration: Number(r.duration_s) };
}
