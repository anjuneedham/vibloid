"use client";
import { useState } from "react";
import { api, useApi } from "@/lib/client";

const LABELS: Record<string, string> = {
  rights_ok: "All clip sources have usable rights", facts_resolved: "Fact-check items resolved, no policy violations",
  disclaimer_present: "Financial disclaimer is in the description", no_unlicensed_audio: "Every audio/image asset has a license on record",
};

function Candidate({ p, onDone }: { p: any; onDone: () => void }) {
  const chk = useApi<{ auto: Record<string, boolean>; problems: string[] }>(`/api/projects/${p.id}/approve`);
  const detail = useApi<any>(`/api/projects/${p.id}`);
  const [watched, setWatched] = useState(false);
  const [when, setWhen] = useState("");
  const [err, setErr] = useState("");
  const final = detail.data?.renders?.find((r: any) => r.kind === "final");
  const ok = chk.data && chk.data.problems.length === 0;

  return (
    <div className="card">
      <div className="row"><h2 style={{ margin: 0 }}>{detail.data?.packaging?.chosen_title ?? p.title}</h2><span className="pill warn">{p.status}</span><a href={`/studio/${p.id}`}>open in studio</a></div>
      <div className="grid" style={{ marginTop: 10 }}>
        <div>{final ? <video src={`/api/media/${final.storage_key}`} controls playsInline style={{ maxWidth: 320 }} /> : <p className="err">No final render yet.</p>}</div>
        <div>
          {Object.entries(LABELS).map(([k, l]) => <div key={k}>{chk.data?.auto[k] ? <span className="good">✓</span> : <span className="err">✗</span>} {l}</div>)}
          {chk.data?.problems.map((x) => <div key={x} className="err" style={{ fontSize: 13 }}>⛔ {x}</div>)}
          <hr style={{ borderColor: "var(--line)" }} />
          <label style={{ flexDirection: "row", alignItems: "center", gap: 8, color: "var(--text)", fontSize: 14 }}>
            <input type="checkbox" checked={watched} onChange={(e) => setWatched(e.target.checked)} /> I watched the final video start to finish
          </label>
          <label style={{ marginTop: 8 }}>Schedule (optional, otherwise uploaded as private)<input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} /></label>
          <div style={{ marginTop: 10 }}>
            <button className="ok" disabled={!ok || !watched} onClick={async () => {
              try { await api(`/api/projects/${p.id}/approve`, { method: "POST", json: { preview_watched: watched, scheduled_at: when ? new Date(when).toISOString() : undefined } }); onDone(); } catch (e) { setErr((e as Error).message); }
            }}>Approve &amp; queue upload</button> <span className="err">{err}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Queue() {
  const projects = useApi<{ projects: any[] }>("/api/projects", 6000);
  const items = useApi<{ items: any[] }>("/api/publish", 5000);
  const quota = useApi<any>("/api/youtube/quota", 15000);
  const waiting = (projects.data?.projects ?? []).filter((p) => ["rendered", "packaged"].includes(p.status));

  return (
    <>
      <h1>Review queue</h1>
      {quota.data && <p className="mute">YouTube API quota today: {quota.data.used}/{quota.data.limit} units · about {quota.data.uploadsLeft} upload(s) left · resets {new Date(quota.data.resetsAt).toLocaleString()}</p>}
      <p className="mute" style={{ fontSize: 13 }}>Nothing is uploaded until you approve it here. The server re-checks every gate again right before uploading.</p>
      {waiting.map((p) => <Candidate key={p.id} p={p} onDone={() => { projects.reload(); items.reload(); }} />)}
      {projects.data && !waiting.length && <div className="card mute">Nothing waiting for review. Finish a final render and the packaging step in the Studio.</div>}
      <div className="card">
        <h2>Publishing</h2>
        <table>
          <thead><tr><th>Video</th><th>Status</th><th>Approved</th><th>Schedule</th><th>YouTube</th></tr></thead>
          <tbody>{(items.data?.items ?? []).map((q) => (
            <tr key={q.id}><td>{q.chosen_title ?? q.project_title}</td><td><span className={`pill ${q.status === "failed" ? "bad" : q.status === "pending" ? "" : "ok"}`}>{q.status}</span>{q.error && <div className="err" style={{ fontSize: 12 }}>{q.error}</div>}</td>
              <td>{q.approved_at ? new Date(q.approved_at).toLocaleString() : "–"}</td><td>{q.scheduled_at ? new Date(q.scheduled_at).toLocaleString() : "private"}</td>
              <td>{q.youtube_video_id ? <a href={`https://studio.youtube.com/video/${q.youtube_video_id}/edit`} target="_blank">{q.youtube_video_id}</a> : "–"}</td></tr>
          ))}</tbody>
        </table>
      </div>
    </>
  );
}
