import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { migrate } from "../scripts/migrate";
import { getPool, closePool } from "../src/lib/db";
import { evaluateYpp, type YppSnapshot } from "../src/lib/ypp";
import { pullChannelStats, yppProgress, MockAnalyticsClient } from "../src/lib/analytics";

const snap = (o: Partial<YppSnapshot> = {}): YppSnapshot => ({ subscribers: 0, longWatchMinutes365: 0, shortsViews90: 0, longAvgViewDurationS: 240, longWatchMinutes28: 0, subsGained28: 0, ...o });

describe("evaluateYpp (pure)", () => {
  it("brand-new channel is not eligible", () => {
    const r = evaluateYpp(snap(), 0);
    expect(r.status).toBe("not_yet");
    expect(r.tiers.full.met).toBe(false);
    expect(r.projection.weeksToFull).toBeNull(); // no pace
  });

  it("early tier needs 500 subs, 3 uploads and hours OR shorts views", () => {
    const base = { subscribers: 500, longWatchMinutes365: 3_000 * 60 };
    expect(evaluateYpp(snap(base), 3).status).toBe("early");
    expect(evaluateYpp(snap(base), 2).status).toBe("not_yet"); // too few uploads
    expect(evaluateYpp(snap({ subscribers: 500, shortsViews90: 3_000_000 }), 3).status).toBe("early"); // shorts path
    expect(evaluateYpp(snap({ subscribers: 499, longWatchMinutes365: 3_000 * 60 }), 3).status).toBe("not_yet");
  });

  it("full tier: 1,000 subs and 4,000 hours or 10M shorts views; uploads not required", () => {
    expect(evaluateYpp(snap({ subscribers: 1000, longWatchMinutes365: 4_000 * 60 }), 0).status).toBe("full");
    expect(evaluateYpp(snap({ subscribers: 1000, shortsViews90: 10_000_000 }), 0).status).toBe("full");
    expect(evaluateYpp(snap({ subscribers: 1000, longWatchMinutes365: 3_999 * 60 }), 5).status).toBe("early");
    expect(evaluateYpp(snap({ subscribers: 999, longWatchMinutes365: 9_999 * 60 }), 5).status).toBe("early");
  });

  it("converts the watch-hour gap into views at the current average view duration", () => {
    // 4,000h target, 1,000h done => 3,000h = 10.8M seconds; at 240s avg => 45,000 views
    const r = evaluateYpp(snap({ subscribers: 100, longWatchMinutes365: 1_000 * 60, longAvgViewDurationS: 240 }), 3);
    expect(r.projection.remainingHours).toBe(3000);
    expect(r.projection.viewsNeeded).toBe(45_000);
    expect(evaluateYpp(snap({ longAvgViewDurationS: null }), 0).projection.viewsNeeded).toBeNull();
  });

  it("projects weeks from the last 28 days' pace and takes the slower requirement", () => {
    // pace: 100h/week (24,000 min / 4 / 60), 25 subs/week. Need 3,000h -> 30w; 900 subs -> 36w
    const r = evaluateYpp(snap({ subscribers: 100, longWatchMinutes365: 1_000 * 60, longWatchMinutes28: 400 * 60, subsGained28: 100 }), 3);
    expect(r.projection.weeksToHours).toBe(30);
    expect(r.projection.weeksToSubs).toBe(36);
    expect(r.projection.weeksToFull).toBe(36);
    expect(r.nextStep).toMatch(/Subscribers are the bottleneck/);
  });

  it("names watch time as the bottleneck when subscribers are further along", () => {
    const r = evaluateYpp(snap({ subscribers: 900, longWatchMinutes365: 500 * 60 }), 3);
    expect(r.nextStep).toMatch(/Watch time is the bottleneck/);
  });
});

describe("channel snapshots", () => {
  beforeAll(async () => { await getPool().query("drop schema public cascade; create schema public;"); await migrate(); });
  afterAll(closePool);

  it("snapshots only connected channels, idempotently, and reports progress with uploads", async () => {
    const db = getPool();
    const ch = (await db.query("insert into channels (name, youtube_refresh_token) values ('Main','enc') returning id")).rows[0].id;
    await db.query("insert into channels (name) values ('Not connected')");
    const now = new Date("2026-11-18T20:00:00Z");
    expect(await pullChannelStats(new MockAnalyticsClient(undefined, { subscribers: 700 }), now)).toBe(1);
    expect(await pullChannelStats(new MockAnalyticsClient(undefined, { subscribers: 750, longWatchMinutes365: 3_100 * 60 }), now)).toBe(1);
    const rows = (await db.query("select snapshot_date::text d, subscribers from channel_snapshots")).rows;
    expect(rows).toEqual([{ d: "2026-11-17", subscribers: 750 }]); // yesterday; upserted, not duplicated

    for (let i = 0; i < 3; i++) {
      const p = (await db.query("insert into projects (title,format,status,channel_id) values ($1,'long','published',$2) returning id", [`V${i}`, ch])).rows[0].id;
      await db.query("insert into publish_queue (project_id,status,approved_at,approved_by,published_at,youtube_video_id) values ($1,'published',now(),'owner',now(),$2)", [p, `v${i}`]);
    }
    const [y] = await yppProgress();
    expect(y.channel).toBe("Main");
    expect(y.uploads90).toBe(3);
    expect(y.progress!.status).toBe("early"); // 750 subs, 3,100h, 3 uploads
  });

  it("returns no progress for a connected channel with no snapshot yet", async () => {
    await getPool().query("delete from channel_snapshots");
    expect((await yppProgress())[0].progress).toBeNull();
  });
});
