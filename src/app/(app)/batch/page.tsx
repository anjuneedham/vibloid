"use client";
import { useState } from "react";
import { api, useApi } from "@/lib/client";

const STAGE: Record<string, [string, string]> = {
  scripting: ["writing script", "warn"], assembling: ["voice + visuals", "warn"], rendering: ["rendering", "warn"], packaging: ["title + thumbnails", "warn"],
  packaged: ["ready for review", "ok"], needs_review: ["needs you", "bad"], needs_title: ["needs a better script", "bad"],
};

export default function Batch() {
  const ch = useApi<{ channels: any[] }>("/api/channels");
  const batches = useApi<{ batches: any[] }>("/api/batches", 4000);
  const [a, setA] = useState(""); const [b, setB] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const attention = (ch.data?.channels ?? []).filter((c) => c.kind === "attention");
  const brand = (ch.data?.channels ?? []).filter((c) => c.kind === "brand");

  async function plan() {
    setBusy(true); setMsg(null);
    try { await api("/api/batches", { method: "POST", json: { attention_channel_id: a || attention[0]?.id, brand_channel_id: b || brand[0]?.id } }); setMsg({ ok: true, t: "Batch planned. Production is running; videos stop at “needs you” when something needs a human." }); batches.reload(); }
    catch (e) { setMsg({ ok: false, t: (e as Error).message }); }
    setBusy(false);
  }

  return (
    <>
      <h1>Batch of six</h1>
      <div className="card">
        <p className="mute" style={{ marginTop: 0 }}>Plans <strong>4</strong> Shorts for your attention channel (each testing a different format) and <strong>2</strong> for your own-app channel, then produces each one up to “ready for review”. Nothing is uploaded until you approve it in the <a href="/queue">Queue</a>.</p>
        {(!attention.length || !brand.length) && <p className="err">Create an attention channel and a brand channel in <a href="/settings">Settings</a> first.</p>}
        <div className="row">
          <label>Attention channel<select value={a} onChange={(e) => setA(e.target.value)}>{attention.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label>Brand channel (your own app)<select value={b} onChange={(e) => setB(e.target.value)}>{brand.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <button disabled={busy || !attention.length || !brand.length} onClick={plan}>{busy ? "Planning…" : "Plan and produce 6 videos"}</button>
        </div>
        {msg && <p className={msg.ok ? "good" : "err"}>{msg.t}</p>}
      </div>

      {(batches.data?.batches ?? []).map((bt) => (
        <div className="card" key={bt.id}>
          <h2>Batch · {new Date(bt.created_at).toLocaleString()}</h2>
          <table>
            <thead><tr><th>Video</th><th>Channel</th><th>Format tested</th><th>Status</th><th /></tr></thead>
            <tbody>{bt.projects.map((p: any) => {
              const [label, cls] = STAGE[p.stage] ?? [p.status, ""];
              return (
                <tr key={p.id}>
                  <td><a href={`/studio/${p.id}`}>{p.title}</a>{p.stage === "needs_review" && p.blockers && <div className="err" style={{ fontSize: 12 }}>{p.blockers.join("; ")}</div>}</td>
                  <td>{p.channel} <span className="pill">{p.kind}</span></td>
                  <td>{p.kind === "attention" ? <>{p.style}<div className="mute" style={{ fontSize: 12 }}>{p.hypothesis}</div></> : "–"}</td>
                  <td><span className={`pill ${cls}`}>{label}</span></td>
                  <td>{["needs_review", "needs_title"].includes(p.stage) && <button className="sec" onClick={async () => { await api(`/api/projects/${p.id}/produce`, { method: "POST" }); batches.reload(); }}>Continue</button>}</td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      ))}
      {batches.data && !batches.data.batches.length && <div className="card mute">No batches yet.</div>}
    </>
  );
}
