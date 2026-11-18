"use client";
import { api, useApi } from "@/lib/client";
import { useState } from "react";

export default function Insights() {
  const { data, reload } = useApi<any>("/api/insights", 8000);
  const [msg, setMsg] = useState("");
  const ins = data?.insights;
  const latest = data?.reports?.[0];

  return (
    <>
      <h1>What’s working</h1>
      {ins?.sampleWarning && <div className="card" style={{ borderColor: "var(--accent)" }}>{ins.sampleWarning}</div>}
      <div className="row" style={{ marginBottom: 14 }}>
        <button onClick={async () => { try { await api("/api/jobs", { method: "POST", json: { type: "pull_analytics" } }); await api("/api/jobs", { method: "POST", json: { type: "weekly_report" } }); setMsg("Queued: refresh analytics, then the weekly report."); setTimeout(reload, 4000); } catch (e) { setMsg((e as Error).message); } }}>Refresh data &amp; write report</button>
        <span className="good">{msg}</span>
      </div>

      {data?.ypp?.map((y: any) => <YppCard key={y.channelId} y={y} />)}

      {ins && (
        <div className="grid">
          <div className="card"><h2>Top videos (28 days)</h2>
            <table><tbody>{ins.topVideos.map((v: any) => <tr key={v.project_id}><td>{v.title}</td><td>{v.views} views</td><td className="mute">{v.avg_view_duration_s ? `${v.avg_view_duration_s.toFixed(0)}s avg` : ""}</td></tr>)}</tbody></table>
            {!ins.topVideos.length && <p className="mute">No analytics yet. Data appears a day after a video is live.</p>}
          </div>
          <div className="card"><h2>Best hooks</h2>{ins.topHooks.map((h: any) => <p key={h.hook}>“{h.hook}” <span className="mute">· {h.views} views</span></p>)}{!ins.topHooks.length && <p className="mute">—</p>}</div>
          <div className="card"><h2>Format</h2>{ins.byFormat.map((g: any) => <p key={g.key}>{g.key}: {g.avgViews} avg views <span className="mute">({g.videos} videos)</span></p>)}</div>
          <div className="card"><h2>Topics</h2>{ins.byTopic.slice(0, 6).map((g: any) => <p key={g.key}>{g.key}: {g.avgViews} avg views</p>)}</div>
          <div className="card"><h2>Posting hour (UTC)</h2>{ins.byHourUtc.map((g: any) => <p key={g.key}>{String(g.key).padStart(2, "0")}:00 → {g.avgViews} avg views <span className="mute">({g.videos})</span></p>)}</div>
        </div>
      )}

      {latest && (
        <div className="card">
          <h2>Weekly report · week of {String(latest.week_start).slice(0, 10)}</h2>
          <p>{latest.report.summary}</p>
          {latest.report.sample_warning && <p className="mute">⚠ {latest.report.sample_warning}</p>}
          <div className="grid">
            <div><h2>Do more</h2>{latest.report.do_more.map((x: any) => <p key={x.item}><strong>{x.item}</strong><br /><span className="mute">{x.evidence}</span></p>)}</div>
            <div><h2>Stop doing</h2>{latest.report.stop_doing.map((x: any) => <p key={x.item}><strong>{x.item}</strong><br /><span className="mute">{x.evidence}</span></p>)}</div>
          </div>
          <h2>Next week</h2>
          <table><tbody>{latest.report.calendar.map((c: any) => <tr key={c.topic}><td>{c.topic}<div className="mute" style={{ fontSize: 12 }}>{c.why}</div></td><td>{c.format}</td><td className="mute">{c.hook_idea}</td></tr>)}</tbody></table>
          <p className="mute" style={{ fontSize: 12 }}>These were added to <a href="/studio">Studio</a> as drafts.</p>
        </div>
      )}
    </>
  );
}

const STATUS: Record<string, string> = { full: "Eligible for ad revenue", early: "Eligible for early tier (fan funding only)", not_yet: "Not eligible yet" };

function Bar({ r }: { r: { label: string; current: number; target: number; met: boolean; pct: number } }) {
  return (
    <p style={{ margin: "6px 0" }}>
      {r.label}: <strong className={r.met ? "good" : ""}>{r.current.toLocaleString("en-US")}</strong> / {r.target.toLocaleString("en-US")}
      <span style={{ display: "block", height: 6, background: "var(--border, #333)", borderRadius: 3 }}><span style={{ display: "block", height: 6, width: `${Math.round(r.pct * 100)}%`, background: "var(--accent)", borderRadius: 3 }} /></span>
    </p>
  );
}

function YppCard({ y }: { y: any }) {
  const p = y.progress;
  if (!p) return <div className="card"><h2>YouTube Partner Program · {y.channel}</h2><p className="mute">No channel data yet. Run “Refresh data &amp; write report”; numbers appear after the first pull.</p></div>;
  const f = p.tiers.full, e = p.tiers.early, pr = p.projection;
  return (
    <div className="card">
      <h2>YouTube Partner Program · {y.channel}</h2>
      <p><strong>{STATUS[p.status]}</strong> <span className="mute">· data as of {y.asOf}</span></p>
      <div className="grid">
        <div><h2>Ad revenue tier</h2><Bar r={f.subs} /><Bar r={f.hours} /><p className="mute" style={{ margin: 0 }}>or</p><Bar r={f.shorts} /></div>
        <div><h2>Early tier (fan funding)</h2><Bar r={e.subs} />{e.uploads && <Bar r={e.uploads} />}<Bar r={e.hours} /><p className="mute" style={{ margin: 0 }}>or</p><Bar r={e.shorts} /></div>
      </div>
      {p.status !== "full" && (
        <p>
          {pr.viewsNeeded ? <>~{pr.viewsNeeded.toLocaleString("en-US")} more long-form views at your current average watch time. </> : null}
          {pr.weeksToFull != null ? <>At the last 28 days’ pace: about {pr.weeksToFull} week{pr.weeksToFull === 1 ? "" : "s"} to the ad-revenue tier.</> : <span className="mute">Not enough recent growth to project a date.</span>}
        </p>
      )}
      <p>{p.nextStep}</p>
      {y.subscribersHidden && <p className="mute">⚠ This channel hides its subscriber count, so subscribers show as 0.</p>}
      <p className="mute" style={{ fontSize: 12 }}>Watch hours count long-form and live only (not Shorts). Analytics can’t filter by privacy, and uploads are counted from what Vibloid published. YouTube Studio → Earn is authoritative.</p>
    </div>
  );
}
