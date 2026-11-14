import os from "node:os";
import { claimJob, completeJob, failJob, reapStale, enqueue, type Handler } from "../src/lib/queue";
import { scheduleRecurringJobs } from "../src/lib/analytics";
import { closePool } from "../src/lib/db";
import { logger, captureError } from "../src/lib/log";
import { handlers } from "./handlers";

const id = `${os.hostname()}-${process.pid}`;
let stop = false;
process.on("SIGINT", () => (stop = true));
process.on("SIGTERM", () => (stop = true));

function providerReport() {
  const p = {
    llm: process.env.LLM_PROVIDER ?? "anthropic", tts: process.env.TTS_PROVIDER ?? "mock", images: process.env.IMAGE_PROVIDER ?? "mock",
    transcript: process.env.TRANSCRIPT_PROVIDER ?? "mock", youtube: process.env.YOUTUBE_PROVIDER ?? "google", analytics: process.env.ANALYTICS_PROVIDER ?? "google",
  };
  const mocks = Object.entries(p).filter(([, v]) => v === "mock").map(([k]) => k);
  logger.info("worker started", { worker: id, handlers: Object.keys(handlers), providers: p });
  if (mocks.length) logger.warn("MOCK providers active: output uses placeholder data", { mocks });
}

async function main() {
  providerReport();
  let lastReap = 0, lastSched = 0;
  while (!stop) {
    if (Date.now() - lastReap > 60_000) { lastReap = Date.now(); const n = await reapStale(); if (n) logger.warn("requeued stale jobs", { count: n }); }
    if (Date.now() - lastSched > 600_000) { lastSched = Date.now(); await scheduleRecurringJobs(enqueue).catch((e) => captureError(e, { where: "scheduleRecurringJobs" })); }
    const job = await claimJob(id, Object.keys(handlers));
    if (!job) { await new Promise((r) => setTimeout(r, Number(process.env.WORKER_POLL_MS ?? 2000))); continue; }
    const t0 = Date.now();
    logger.info("job start", { job: job.id, type: job.type, attempt: job.attempts });
    try {
      const result = await (handlers[job.type] as Handler)(job);
      await completeJob(job.id, result);
      logger.info("job done", { job: job.id, type: job.type, ms: Date.now() - t0 });
    } catch (e) {
      const deferred = (e as any)?.until instanceof Date;
      (deferred ? logger.warn : captureError as any)(deferred ? "job deferred" : (e as Error), { job: job.id, type: job.type, attempt: job.attempts, ms: Date.now() - t0, ...(deferred ? { until: (e as any).until, reason: (e as Error).message } : {}) });
      await failJob(job, e);
    }
  }
  logger.info("worker stopping", { worker: id });
  await closePool();
}
main().catch((e) => { captureError(e, { where: "worker main" }); process.exit(1); });
