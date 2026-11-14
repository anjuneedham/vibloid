import type { Handler } from "../../src/lib/queue";
import { ingestSource } from "./ingest";
import { selectClipsJob } from "./selectClips";
import { generateScriptJob } from "./generateScript";
import { assembleJob } from "./assemble";
import { renderJob } from "./render";
import { packagingJob } from "./packaging";
import { uploadJob } from "./upload";
import { pullAnalyticsJob, weeklyReportJob } from "./analytics";
import { produceJob } from "./produce";

export const handlers: Record<string, Handler> = {
  ingest_source: (job) => ingestSource(job),
  select_clips: selectClipsJob,
  generate_script: generateScriptJob,
  assemble_project: assembleJob,
  render_project: renderJob,
  package_project: packagingJob,
  upload_video: uploadJob,
  produce_project: produceJob,
  pull_analytics: pullAnalyticsJob,
  weekly_report: weeklyReportJob,
};
