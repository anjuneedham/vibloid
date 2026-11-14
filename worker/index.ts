import os from "node:os";
import { claimJob, completeJob, failJob, reapStale, enqueue, type Handler } from "../src/lib/queue";
import { scheduleRecurringJobs } from "../src/lib/analytics";
import { closePool } from "../src/lib/db";
import { handlers } from "./handlers";

const id = `${os.hostname()}-${process.pid}`;
let stop = false;
process.on("SIGINT", () => (stop = true));
process.on("SIGTERM", () => (stop = true));

async function main() {
  console.log(`worker ${id} started; handlers: ${Object.keys(handlers).join(", ")}`);
  let lastReap = 0, lastSched = 0;
  while (!stop) {
    if (Date.now() - lastReap > 60_000) { lastReap = Date.now(); const n = await reapStale(); if (n) console.log("requeued stale jobs:", n); }
    if (Date.now() - lastSched > 600_000) { lastSched = Date.now(); await scheduleRecurringJobs(enqueue).catch((e) => console.error("schedule:", e.message)); }
    const job = await claimJob(id, Object.keys(handlers));
    if (!job) { await new Promise((r) => setTimeout(r, 2000)); continue; }
    console.log(`[${job.type}] ${job.id} attempt ${job.attempts}`);
    try {
      await completeJob(job.id, await (handlers[job.type] as Handler)(job));
    } catch (e) {
      console.error(`[${job.type}] failed:`, (e as Error).message);
      await failJob(job, e);
    }
  }
  await closePool();
}
main().catch((e) => { console.error(e); process.exit(1); });
