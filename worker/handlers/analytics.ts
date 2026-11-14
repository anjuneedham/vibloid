import { pullAnalytics, weeklyReport, MockAnalyticsClient, GoogleAnalyticsClient, type AnalyticsClient } from "../../src/lib/analytics";
import { accessToken } from "../../src/lib/youtube";
import type { Job } from "../../src/lib/queue";

// Mock numbers are used ONLY when explicitly requested; otherwise we call the real API (and fail loudly if YouTube isn't connected).
function client(): AnalyticsClient {
  return process.env.ANALYTICS_PROVIDER === "mock" ? new MockAnalyticsClient() : new GoogleAnalyticsClient(() => accessToken());
}
export const pullAnalyticsJob = async (_j: Job) => ({ snapshots: await pullAnalytics(client()) });
export const weeklyReportJob = async (j: Job) => { const r = await weeklyReport({ jobId: j.id }); return { week: r.week, drafts: r.createdProjects.length }; };
