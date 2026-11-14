import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { migrate } from "../scripts/migrate";
import { getPool, closePool } from "../src/lib/db";
import { MockLLM } from "../src/lib/llm";
import { enqueue } from "../src/lib/queue";
import { createProject, generateScript } from "../src/lib/scripts";
import { pullAnalytics, MockAnalyticsClient, computeInsights, winnersContext, weeklyReport, scheduleRecurringJobs } from "../src/lib/analytics";

const body = (hook: string) => ({
  hook, promise: "Here is the promise.", beats: [1, 2, 3].map((i) => ({ narration: `Beat ${i} narration text.`, visual_query: "money" })), cta: "Follow.", claims: [],
});

async function seedVideo(title: string, format: "short" | "long", hook: string, vid: string, perDay: { views: number; dur: number; subs: number }[]) {
  const db = getPool();
  const p = (await db.query("insert into projects (title,format,topic,status) values ($1,$2,$3,'published') returning id", [title, format, title])).rows[0].id;
  await db.query("insert into scripts (project_id,version,body) values ($1,1,$2)", [p, JSON.stringify(body(hook))]);
  await db.query("insert into publish_queue (project_id,status,approved_at,approved_by,scheduled_at,youtube_video_id) values ($1,'published',now(),'owner',$2,$3)", [p, "2026-11-10T15:00:00Z", vid]);
  for (let i = 0; i < perDay.length; i++) {
    await db.query("insert into analytics_snapshots (youtube_video_id,project_id,snapshot_date,views,avg_view_duration_s,subs_gained) values ($1,$2,(now() - make_interval(days => $3))::date,$4,$5,$6)", [vid, p, i + 1, perDay[i].views, perDay[i].dur, perDay[i].subs]);
  }
  return p;
}

beforeAll(async () => {
  await getPool().query("drop schema public cascade; create schema public;");
  await migrate();
});
afterAll(closePool);

describe("analytics", () => {
  it("no data => no winners context and the prompt is unchanged", async () => {
    expect(await winnersContext()).toBe("");
  });

  it("ranks videos, groups by format, and warns on small samples", async () => {
    await seedVideo("Compound interest explained", "short", "Your money is asleep.", "vidA", [{ views: 5000, dur: 40, subs: 20 }, { views: 3000, dur: 38, subs: 10 }]);
    await seedVideo("5 money myths", "short", "Everything you know is wrong.", "vidB", [{ views: 400, dur: 15, subs: 1 }]);
    await seedVideo("Long budgeting guide", "long", "Budgets fail for one reason.", "vidC", [{ views: 900, dur: 200, subs: 3 }]);
    const ins = await computeInsights();
    expect(ins.sampleSize).toBe(3);
    expect(ins.sampleWarning).toMatch(/Fewer than 5/);
    expect(ins.topVideos[0].title).toBe("Compound interest explained");
    expect(ins.topHooks[0].hook).toBe("Your money is asleep.");
    expect(ins.bestFormat).toBe("short");
    expect(ins.byFormat.find((g) => g.key === "short")!.videos).toBe(2);
    expect(ins.bestHourUtc).toBe(15);
  });

  it("feeds winning hooks into the script prompt", async () => {
    const pid = (await createProject({ title: "New one", format: "short" })).id;
    const llm = new MockLLM(() => body("A fresh hook."));
    await generateScript(pid, { style: "explained_simply", llm });
    expect(llm.calls[0].system).toContain("Your money is asleep.");
    expect(llm.calls[0].system).toContain("imitate the pattern, not the words");
  });

  it("pulls analytics idempotently (upsert per video/day)", async () => {
    const before = (await getPool().query("select count(*) from analytics_snapshots")).rows[0].count;
    const n1 = await pullAnalytics(new MockAnalyticsClient({ views: 77 }));
    const n2 = await pullAnalytics(new MockAnalyticsClient({ views: 88 }));
    expect(n1).toBe(3); expect(n2).toBe(3);
    const after = (await getPool().query("select count(*), max(views) filter (where youtube_video_id='vidB') as v from analytics_snapshots")).rows[0];
    expect(Number(after.count)).toBeLessThanOrEqual(Number(before) + 3); // at most one new row per video, never duplicates
    const y = (await getPool().query("select views from analytics_snapshots where views in (77,88)")).rows.map((r) => r.views);
    expect(y.every((v) => v === 88)).toBe(true);
  });

  it("writes a weekly report from real data and creates draft projects once", async () => {
    const report = {
      summary: "Shorts on compounding outperform.", sample_warning: null,
      do_more: [{ item: "More compounding explainers", evidence: "Compound interest explained: 8000 views" }],
      stop_doing: [{ item: "Generic myth lists", evidence: "5 money myths: 400 views" }],
      calendar: [
        { topic: "Why inflation eats cash", format: "short", style: "explained_simply", hook_idea: "Your cash is shrinking.", why: "compounding topics win" },
        { topic: "The 50/30/20 rule myth", format: "short", style: "myth_vs_reality", hook_idea: "The rule is outdated.", why: "myth angle" },
      ],
    };
    const llm = new MockLLM(() => report);
    const r1 = await weeklyReport({ llm, now: new Date("2026-11-16T20:00:00Z") });
    expect(r1.week).toBe("2026-11-16");
    expect(r1.createdProjects.length).toBe(2);
    expect(r1.report.sample_warning).toMatch(/Fewer than 5/); // forced in even if the model omitted it
    expect(llm.calls[0].user).toContain("Compound interest explained"); // real data in the prompt
    const r2 = await weeklyReport({ llm, now: new Date("2026-11-16T21:00:00Z") });
    expect(r2.createdProjects.length).toBe(0);
    expect((await getPool().query("select count(*) from weekly_reports")).rows[0].count).toBe("1");
    expect((await getPool().query("select count(*) from projects where status='draft' and topic like 'Why inflation%'")).rows[0].count).toBe("1");
  });

  it("recurring jobs are idempotent; weekly report only on Mondays", async () => {
    await getPool().query("delete from jobs");
    const mon = new Date("2026-11-16T20:00:00Z"), tue = new Date("2026-11-17T20:00:00Z");
    await scheduleRecurringJobs(enqueue, mon); await scheduleRecurringJobs(enqueue, mon); await scheduleRecurringJobs(enqueue, tue);
    const types = (await getPool().query("select type, count(*) from jobs group by type order by type")).rows;
    expect(types).toEqual([{ type: "pull_analytics", count: "2" }, { type: "weekly_report", count: "1" }]);
  });
});
