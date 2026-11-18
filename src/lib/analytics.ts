import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { getPool } from "./db";
import { getLLM, type LLM } from "./llm";
import { logCost } from "./queue";
import { pacificDay } from "./youtube";
import { httpError } from "./resilience";
import { evaluateYpp, type YppSnapshot } from "./ypp";

export type VideoStats = { views: number; avgViewDurationS: number | null; ctr: number | null; subsGained: number; estMinutesWatched: number | null; retention: number[] | null };
/** Channel-level numbers behind the YPP tracker (see src/lib/ypp.ts). `subscribers` is null when the channel hides its count. */
export type ChannelStats = YppSnapshot;
export interface AnalyticsClient {
  fetchVideoStats(videoId: string, day: string, channelId?: string | null): Promise<VideoStats>;
  fetchChannelStats(day: string, channelId?: string | null): Promise<ChannelStats>;
}

/** Deterministic fake numbers for dev/tests. */
export class MockAnalyticsClient implements AnalyticsClient {
  constructor(private fixed?: Partial<VideoStats>, private channel?: Partial<ChannelStats>) {}
  async fetchVideoStats(videoId: string): Promise<VideoStats> {
    const h = [...videoId].reduce((a, c) => a + c.charCodeAt(0), 0);
    return { views: 100 + (h % 900), avgViewDurationS: 20 + (h % 30), ctr: 0.03 + (h % 7) / 100, subsGained: h % 9, estMinutesWatched: 50 + (h % 200), retention: [1, 0.8, 0.6, 0.5, 0.4], ...this.fixed };
  }
  async fetchChannelStats(): Promise<ChannelStats> { return { ...MOCK_CHANNEL, ...this.channel }; }
}

/** Mock channel: past the early tier, short of 4,000 hours. */
const MOCK_CHANNEL: ChannelStats = { subscribers: 640, longWatchMinutes365: 120_000, shortsViews90: 400_000, longAvgViewDurationS: 240, longWatchMinutes28: 12_000, subsGained28: 60 };

/** YouTube Analytics API. Not exercised by the test suite (needs live credentials). The CTR metric name is best-effort and tolerated to fail. */
export class GoogleAnalyticsClient implements AnalyticsClient {
  constructor(private token: (channelId?: string | null) => Promise<string>) {}
  private channelId: string | null | undefined;
  private async report(params: Record<string, string>) {
    const res = await fetch("https://youtubeanalytics.googleapis.com/v2/reports?" + new URLSearchParams({ ids: "channel==MINE", ...params }), { headers: { Authorization: `Bearer ${await this.token(this.channelId)}` } });
    if (!res.ok) throw await httpError(res, "analytics");
    return (await res.json()) as any;
  }
  async fetchVideoStats(videoId: string, day: string, channelId?: string | null): Promise<VideoStats> {
    this.channelId = channelId;
    const base = { startDate: day, endDate: day, filters: `video==${videoId}` };
    const core = (await this.report({ ...base, metrics: "views,averageViewDuration,subscribersGained,estimatedMinutesWatched" })).rows?.[0] ?? [0, null, 0, null];
    let ctr: number | null = null;
    try { ctr = (await this.report({ ...base, metrics: "videoThumbnailImpressionsClickRate" })).rows?.[0]?.[0] ?? null; } catch { /* metric not available for this channel */ }
    let retention: number[] | null = null;
    try { retention = ((await this.report({ startDate: "2020-01-01", endDate: day, metrics: "audienceWatchRatio", dimensions: "elapsedVideoTimeRatio", filters: `video==${videoId}` })).rows ?? []).map((r: any[]) => r[1]); } catch { /* optional */ }
    return { views: core[0], avgViewDurationS: core[1], subsGained: core[2], estMinutesWatched: core[3], ctr, retention };
  }

  /**
   * Channel totals for YPP eligibility. Long-form = on-demand + live (Shorts watch time does not count toward the 4,000 hours).
   * Analytics cannot filter by privacy, so private/unlisted viewing is included (negligible in practice); Studio's Earn tab is authoritative.
   * Best-effort against live API (creatorContentType value casing is normalised).
   */
  async fetchChannelStats(day: string, channelId?: string | null): Promise<ChannelStats> {
    this.channelId = channelId;
    const ago = (n: number) => new Date(new Date(day + "T00:00:00Z").getTime() - n * 86400_000).toISOString().slice(0, 10);
    const byType = async (days: number) => {
      const rows: any[][] = (await this.report({ startDate: ago(days - 1), endDate: day, dimensions: "creatorContentType", metrics: "views,estimatedMinutesWatched,averageViewDuration,subscribersGained,subscribersLost" })).rows ?? [];
      const t = { long: { views: 0, minutes: 0, dur: null as number | null }, shorts: { views: 0 }, subsNet: 0 };
      for (const [type, views, minutes, dur, gained, lost] of rows) {
        const k = String(type).toUpperCase();
        if (k === "SHORTS") t.shorts.views += views;
        else if (k === "VIDEO_ON_DEMAND" || k === "LIVE_STREAM") {
          t.long.dur = t.long.views + views > 0 ? ((t.long.dur ?? 0) * t.long.views + dur * views) / (t.long.views + views) : t.long.dur; // views-weighted
          t.long.views += views; t.long.minutes += minutes;
        }
        t.subsNet += (gained ?? 0) - (lost ?? 0);
      }
      return t;
    };
    const [y, q, m] = [await byType(365), await byType(90), await byType(28)];
    const res = await fetch("https://www.googleapis.com/youtube/v3/channels?" + new URLSearchParams({ part: "statistics", mine: "true" }), { headers: { Authorization: `Bearer ${await this.token(channelId)}` } });
    if (!res.ok) throw await httpError(res, "channel statistics");
    const st = ((await res.json()) as any).items?.[0]?.statistics;
    return {
      subscribers: !st || st.hiddenSubscriberCount ? null : Number(st.subscriberCount),
      longWatchMinutes365: y.long.minutes, shortsViews90: q.shorts.views,
      longAvgViewDurationS: m.long.dur, longWatchMinutes28: m.long.minutes, subsGained28: m.subsNet,
    };
  }
}

export async function pullAnalytics(client: AnalyticsClient, now = new Date()) {
  const db = getPool();
  const day = pacificDay(new Date(now.getTime() - 24 * 3600_000)); // yesterday: complete data
  const vids = (await db.query("select distinct q.project_id, q.youtube_video_id, p.channel_id from publish_queue q join projects p on p.id=q.project_id where q.youtube_video_id is not null and q.status in ('scheduled','published','uploaded_private')")).rows;
  let n = 0;
  for (const v of vids) {
    const s = await client.fetchVideoStats(v.youtube_video_id, day, v.channel_id);
    await db.query(
      `insert into analytics_snapshots (youtube_video_id,project_id,snapshot_date,views,avg_view_duration_s,ctr,subs_gained,retention,estimated_minutes_watched) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       on conflict (youtube_video_id, snapshot_date) do update set views=excluded.views, avg_view_duration_s=excluded.avg_view_duration_s, ctr=excluded.ctr, subs_gained=excluded.subs_gained, retention=excluded.retention, estimated_minutes_watched=excluded.estimated_minutes_watched`,
      [v.youtube_video_id, v.project_id, day, s.views, s.avgViewDurationS, s.ctr, s.subsGained, s.retention ? JSON.stringify(s.retention) : null, s.estMinutesWatched],
    );
    n++;
  }
  return n;
}

/** One snapshot per connected channel per day (upsert, so it is safe to re-run). */
export async function pullChannelStats(client: AnalyticsClient, now = new Date()) {
  const db = getPool();
  const day = pacificDay(new Date(now.getTime() - 24 * 3600_000));
  const channels = (await db.query("select id from channels where youtube_refresh_token is not null order by created_at")).rows;
  for (const c of channels) {
    const s = await client.fetchChannelStats(day, c.id);
    await db.query(
      `insert into channel_snapshots (channel_id,snapshot_date,subscribers,long_watch_minutes_365,shorts_views_90,long_avg_view_duration_s,long_watch_minutes_28,subs_gained_28) values ($1,$2,$3,$4,$5,$6,$7,$8)
       on conflict (channel_id, snapshot_date) do update set subscribers=excluded.subscribers, long_watch_minutes_365=excluded.long_watch_minutes_365, shorts_views_90=excluded.shorts_views_90, long_avg_view_duration_s=excluded.long_avg_view_duration_s, long_watch_minutes_28=excluded.long_watch_minutes_28, subs_gained_28=excluded.subs_gained_28`,
      [c.id, day, s.subscribers, s.longWatchMinutes365, s.shortsViews90, s.longAvgViewDurationS, s.longWatchMinutes28, s.subsGained28],
    );
  }
  return channels.length;
}

/** YPP progress per connected channel, from the latest snapshot. Uploads are counted from what Vibloid published (status 'published'). */
export async function yppProgress() {
  const db = getPool();
  const rows = (await db.query(
    `select c.id, c.name, s.snapshot_date, s.subscribers, s.long_watch_minutes_365, s.shorts_views_90, s.long_avg_view_duration_s, s.long_watch_minutes_28, s.subs_gained_28,
            (select count(*)::int from publish_queue q join projects p on p.id=q.project_id
              where p.channel_id=c.id and q.status='published' and coalesce(q.published_at, q.scheduled_at, q.approved_at) >= now() - interval '90 days') as uploads90
     from channels c
     left join lateral (select * from channel_snapshots x where x.channel_id=c.id order by snapshot_date desc limit 1) s on true
     where c.youtube_refresh_token is not null order by c.created_at`)).rows;
  return rows.map((r) => ({
    channelId: r.id as string, channel: r.name as string, asOf: r.snapshot_date ? String(r.snapshot_date).slice(0, 10) : null, uploads90: r.uploads90 as number,
    progress: r.snapshot_date ? evaluateYpp({
      subscribers: r.subscribers, longWatchMinutes365: Number(r.long_watch_minutes_365), shortsViews90: Number(r.shorts_views_90),
      longAvgViewDurationS: r.long_avg_view_duration_s == null ? null : Number(r.long_avg_view_duration_s), longWatchMinutes28: Number(r.long_watch_minutes_28), subsGained28: r.subs_gained_28,
    }, r.uploads90) : null,
    subscribersHidden: !!r.snapshot_date && r.subscribers == null,
  }));
}

export type VideoPerf = { project_id: string; title: string; format: string; topic: string | null; hook: string | null; style_len_words: number; hour_utc: number | null; views: number; avg_view_duration_s: number | null; subs: number; ctr: number | null; days: number };

export async function videoPerformance(sinceDays = 28): Promise<VideoPerf[]> {
  const r = await getPool().query(
    `select p.id as project_id, coalesce(k.chosen_title,p.title) as title, p.format, p.topic,
            (select body->>'hook' from scripts s where s.project_id=p.id order by version desc limit 1) as hook,
            (select array_length(regexp_split_to_array(coalesce((body->>'hook'),'') || ' ' || coalesce((body->>'promise'),''), '\\s+'),1) from scripts s where s.project_id=p.id order by version desc limit 1) as style_len_words,
            extract(hour from coalesce(q.scheduled_at, q.approved_at) at time zone 'UTC')::int as hour_utc,
            sum(a.views)::int as views, avg(a.avg_view_duration_s) as avg_view_duration_s, sum(a.subs_gained)::int as subs, avg(a.ctr) as ctr, count(distinct a.snapshot_date)::int as days
     from analytics_snapshots a
     join projects p on p.id=a.project_id
     left join packaging k on k.project_id=p.id
     left join lateral (select * from publish_queue q where q.project_id=p.id and q.youtube_video_id is not null order by created_at desc limit 1) q on true
     where a.snapshot_date >= (now() - make_interval(days => $1))::date
     group by p.id, k.chosen_title, q.scheduled_at, q.approved_at
     order by views desc`, [sinceDays]);
  return r.rows.map((x) => ({ ...x, avg_view_duration_s: x.avg_view_duration_s == null ? null : Number(x.avg_view_duration_s), ctr: x.ctr == null ? null : Number(x.ctr) }));
}

/** Score blends reach and watch time; relies on view-duration when present. */
export const score = (v: VideoPerf) => v.views * (1 + (v.avg_view_duration_s ?? 0) / 60) + v.subs * 25;

export async function computeInsights(sinceDays = 28) {
  const vids = await videoPerformance(sinceDays);
  const ranked = [...vids].sort((a, b) => score(b) - score(a));
  const group = <K extends string | number>(f: (v: VideoPerf) => K | null) => {
    const m = new Map<K, VideoPerf[]>();
    vids.forEach((v) => { const k = f(v); if (k != null) m.set(k, [...(m.get(k) ?? []), v]); });
    return [...m.entries()].map(([key, vs]) => ({ key, videos: vs.length, avgViews: Math.round(vs.reduce((a, v) => a + v.views, 0) / vs.length), avgDuration: +(vs.reduce((a, v) => a + (v.avg_view_duration_s ?? 0), 0) / vs.length).toFixed(1) })).sort((a, b) => b.avgViews - a.avgViews);
  };
  return {
    sampleSize: vids.length,
    sampleWarning: vids.length < 5 ? "Fewer than 5 videos with data: treat patterns as anecdotes, not evidence." : null,
    topVideos: ranked.slice(0, 5),
    topHooks: ranked.filter((v) => v.hook).slice(0, 5).map((v) => ({ hook: v.hook!, views: v.views, avgDuration: v.avg_view_duration_s })),
    byFormat: group((v) => v.format),
    byTopic: group((v) => v.topic),
    byHourUtc: group((v) => v.hour_utc),
    bestFormat: group((v) => v.format)[0]?.key ?? null,
    bestHourUtc: group((v) => v.hour_utc)[0]?.key ?? null,
  };
}

/** Few-shot context for the clip and script prompts: what has actually performed. Empty until there is data. */
export async function winnersContext(): Promise<string> {
  const ins = await computeInsights(60);
  if (!ins.topHooks.length) return "";
  return "Hooks from this channel's best-performing videos (imitate the pattern, not the words):\n" +
    ins.topHooks.slice(0, 3).map((h) => `- "${h.hook}" (${h.views} views${h.avgDuration ? `, ${h.avgDuration.toFixed(0)}s avg watch` : ""})`).join("\n");
}

const Report = z.object({
  summary: z.string(), sample_warning: z.string().nullable().optional(),
  do_more: z.array(z.object({ item: z.string(), evidence: z.string() })).max(8),
  stop_doing: z.array(z.object({ item: z.string(), evidence: z.string() })).max(8),
  calendar: z.array(z.object({ topic: z.string(), format: z.enum(["short", "long"]), style: z.enum(["seven_habits", "story_motivation", "explained_simply", "myth_vs_reality"]), hook_idea: z.string(), why: z.string() })).min(1).max(10),
});
export type WeeklyReport = z.infer<typeof Report>;

const mondayOf = (d: Date) => { const x = new Date(pacificDay(d) + "T00:00:00Z"); x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7)); return x.toISOString().slice(0, 10); };

export async function weeklyReport(opts: { llm?: LLM; jobId?: string; now?: Date } = {}) {
  const db = getPool();
  const week = mondayOf(opts.now ?? new Date());
  const ins = await computeInsights(28);
  const user = `Week starting ${week}.\n\nDATA (JSON):\n${JSON.stringify({ sampleSize: ins.sampleSize, sampleWarning: ins.sampleWarning, topVideos: ins.topVideos, byFormat: ins.byFormat, byTopic: ins.byTopic, byHourUtc: ins.byHourUtc, topHooks: ins.topHooks }, null, 1)}`;
  const { data, usage } = await (opts.llm ?? getLLM()).json({ system: fs.readFileSync(path.resolve("prompts/weekly-report.md"), "utf8"), user, schema: Report, maxTokens: 3000 });
  await logCost({ jobId: opts.jobId, provider: "anthropic", unit: "tokens", quantity: usage.inputTokens + usage.outputTokens, costUsd: usage.costUsd });
  if (ins.sampleWarning && !data.sample_warning) data.sample_warning = ins.sampleWarning;
  await db.query(`insert into weekly_reports (week_start, report) values ($1,$2) on conflict (week_start) do update set report=excluded.report`, [week, JSON.stringify(data)]);
  // Calendar -> draft projects (once per week/topic; re-running does not duplicate).
  const created: string[] = [];
  for (const c of data.calendar) {
    const exists = (await db.query("select 1 from projects where topic=$1 and created_at > now() - interval '14 days'", [c.topic])).rowCount;
    if (exists) continue;
    const r = await db.query("insert into projects (title,format,topic,status,brief) values ($1,$2,$3,'draft',$4) returning id", [c.topic.slice(0, 120), c.format, c.topic, JSON.stringify({ style: c.style, hook_idea: c.hook_idea, why: c.why, from_report: week })]);
    created.push(r.rows[0].id);
  }
  return { week, report: data, createdProjects: created };
}

/** Called regularly by the worker; idempotency keys make it safe to call often. */
export async function scheduleRecurringJobs(enqueue: (t: string, p: unknown, o: { idempotencyKey: string }) => Promise<string>, now = new Date()) {
  const day = pacificDay(now);
  await enqueue("pull_analytics", {}, { idempotencyKey: `analytics:${day}` });
  if (new Date(day + "T00:00:00Z").getUTCDay() === 1) await enqueue("weekly_report", {}, { idempotencyKey: `weekly:${day}` });
}
