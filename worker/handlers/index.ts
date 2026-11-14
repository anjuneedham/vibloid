import type { Handler } from "../../src/lib/queue";
import { ingestSource } from "./ingest";
import { selectClipsJob } from "./selectClips";

export const handlers: Record<string, Handler> = {
  ingest_source: (job) => ingestSource(job),
  select_clips: selectClipsJob,
};
