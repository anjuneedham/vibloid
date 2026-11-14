"use client";
import { useState } from "react";
import { api, useApi, usd } from "@/lib/client";

export default function Settings() {
  const { data, reload } = useApi<any>("/api/settings");
  const ds = useApi<{ datasets: any[] }>("/api/datasets");
  const [nc, setNc] = useState<any>({ kind: "attention", niche: "trading" });
  const [d, setD] = useState<any>({});
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const say = (t: string) => { setMsg(t); setErr(""); };

  return (
    <>
      <h1>Settings</h1>

      {data?.budget && (
        <div className="card">
          <h2>Spending limits</h2>
          <p>{usd(data.budget.spent)} spent this month of a <strong>{usd(data.budget.monthly)}</strong> cap · per-video cap {usd(data.budget.perVideo)}.
            {data.budget.stopped && <span className="err"> Cap reached: spending jobs are paused until you raise MONTHLY_BUDGET_USD.</span>}</p>
          <p className="mute" style={{ fontSize: 13 }}>These are hard stops: jobs wait instead of spending past the cap. Set MONTHLY_BUDGET_USD and PER_VIDEO_BUDGET_USD in the environment.</p>
        </div>
      )}

      <div className="card">
        <h2>Channels</h2>
        <table>
          <thead><tr><th>Name</th><th>Type</th><th>YouTube</th></tr></thead>
          <tbody>{(data?.channels ?? []).map((c: any) => (
            <tr key={c.id}>
              <td>{c.name}<div className="mute" style={{ fontSize: 12 }}>{c.niche}{c.kind === "brand" ? ` · promotes ${c.voice?.app?.name ?? "your app"}` : ""}</div></td>
              <td><span className="pill">{c.kind}</span></td>
              <td>{c.youtube_connected ? <span className="good">connected</span> : <span className="mute">not connected</span>} <a href={`/api/youtube/auth?channel=${c.id}`}>{c.youtube_connected ? "reconnect" : "connect"}</a></td>
            </tr>
          ))}</tbody>
        </table>
        <div className="row" style={{ marginTop: 12 }}>
          <label>Name<input value={nc.name ?? ""} onChange={(e) => setNc({ ...nc, name: e.target.value })} /></label>
          <label>Type<select value={nc.kind} onChange={(e) => setNc({ ...nc, kind: e.target.value })}><option value="attention">Attention (educational trading)</option><option value="brand">Brand (promotes my own app)</option></select></label>
          {nc.kind === "brand" && <><label>App name<input value={nc.app_name ?? ""} placeholder="Trade Notes" onChange={(e) => setNc({ ...nc, app_name: e.target.value })} /></label><label>One-line description<input value={nc.app_blurb ?? ""} placeholder="a trading journal" onChange={(e) => setNc({ ...nc, app_blurb: e.target.value })} /></label></>}
          <button onClick={async () => { try { await api("/api/channels", { method: "POST", json: nc }); say("Channel created"); setNc({ kind: "attention", niche: "trading" }); reload(); } catch (e) { setErr((e as Error).message); } }}>Add channel</button>
        </div>
        <p className="mute" style={{ fontSize: 13 }}>Brand channels automatically get an “own app” disclosure in the description, and scripts must say it out loud. Connecting needs YOUTUBE_CLIENT_ID / SECRET / REDIRECT_URI from a Google Cloud OAuth client.</p>
      </div>

      <div className="card">
        <h2>Chart data (real numbers only)</h2>
        <p className="mute" style={{ fontSize: 13, marginTop: 0 }}>Charts only draw from data you add here, and always show the source on screen. Paste a CSV with <code>date,open,high,low,close</code> or <code>date,value</code>. Make sure you are allowed to use the data (check your source’s terms).</p>
        <table><tbody>{(ds.data?.datasets ?? []).map((x: any) => <tr key={x.id}><td>{x.name}</td><td className="mute">{x.kind} · {x.n} points</td><td className="mute">{x.source}{x.as_of ? ` · ${String(x.as_of).slice(0, 10)}` : ""}</td></tr>)}</tbody></table>
        <div className="grid" style={{ marginTop: 10 }}>
          <label>Name<input value={d.name ?? ""} onChange={(e) => setD({ ...d, name: e.target.value })} placeholder="SPY daily, Feb-Mar 2020" /></label>
          <label>Source (shown on screen)<input value={d.source ?? ""} onChange={(e) => setD({ ...d, source: e.target.value })} placeholder="e.g. Nasdaq historical data" /></label>
          <label>As of (date)<input type="date" value={d.as_of ?? ""} onChange={(e) => setD({ ...d, as_of: e.target.value })} /></label>
        </div>
        <label style={{ marginTop: 8 }}>CSV<textarea value={d.csv ?? ""} onChange={(e) => setD({ ...d, csv: e.target.value })} style={{ minHeight: 110, fontFamily: "monospace" }} /></label>
        <div style={{ marginTop: 8 }}><button onClick={async () => { try { await api("/api/datasets", { method: "POST", json: d }); say("Dataset saved"); setD({}); ds.reload(); } catch (e) { setErr((e as Error).message); } }}>Save dataset</button></div>
      </div>

      <div className="card">
        <h2>Providers</h2>
        <table><tbody>{Object.entries(data?.providers ?? {}).map(([k, v]: any) => (
          <tr key={k}><td>{k.replace("_", " ")}</td><td>{v.name}</td><td><span className={`pill ${v.configured ? "ok" : "bad"}`}>{v.configured ? "ready" : "missing key"}</span></td></tr>
        ))}</tbody></table>
        <p className="mute" style={{ fontSize: 13 }}>Chosen with environment variables (see .env.example). “mock” runs offline with placeholder voice/images/footage.</p>
      </div>
      <p className="good">{msg}</p><p className="err">{err}</p>
    </>
  );
}
