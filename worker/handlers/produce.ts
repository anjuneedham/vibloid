import { produceProject } from "../../src/lib/produce";
import type { Job } from "../../src/lib/queue";

export const produceJob = (job: Job) => produceProject(job.payload.projectId, job.id);
