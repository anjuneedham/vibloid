import type { Handler } from "../../src/lib/queue";
import { ingestSource } from "./ingest";
import { selectClipsJob } from "./selectClips";
import { generateScriptJob } from "./generateScript";

export const handlers: Record<string, Handler> = {
  ingest_source: (job) => ingestSource(job),
  select_clips: selectClipsJob,
  generate_script: generateScriptJob,
};
