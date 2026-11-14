"use client";
import { useEffect, useState } from "react";
import { api, useApi } from "@/lib/client";

export default function Settings() {
  const { data, reload } = useApi<any>("/api/settings");
  const [brand, setBrand] = useState<any>({ font: "Inter", accent: "#f5c542" });
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  useEffect(() => { if (data?.channel) { setBrand((b: any) => ({ ...b, ...data.channel.brand })); setName(data.channel.name); } }, [data]);

  return (
    <>
      <h1>Settings</h1>
      <div className="card">
        <h2>Providers</h2>
        <table><tbody>{Object.entries(data?.providers ?? {}).map(([k, v]: any) => (
          <tr key={k}><td>{k}</td><td>{v.name}</td><td><span className={`pill ${v.configured ? "ok" : "bad"}`}>{v.configured ? "ready" : "missing key"}</span></td></tr>
        ))}</tbody></table>
        <p className="mute" style={{ fontSize: 13 }}>Providers are chosen with environment variables (see .env.example). “mock” runs the whole pipeline offline with placeholder audio and images.</p>
      </div>
      <div className="card">
        <h2>YouTube</h2>
        {data?.channel?.youtube_connected ? <p className="good">Connected{data.channel.youtube_channel_id ? ` (${data.channel.youtube_channel_id})` : ""}.</p> : <p className="mute">Not connected.</p>}
        <a className="btn" href="/api/youtube/auth">{data?.channel?.youtube_connected ? "Reconnect" : "Connect YouTube"}</a>
        <p className="mute" style={{ fontSize: 13 }}>Needs YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET / YOUTUBE_REDIRECT_URI from a Google Cloud OAuth client.</p>
      </div>
      <div className="card">
        <h2>Brand kit (captions)</h2>
        <div className="row">
          <label>Channel name<input value={name} onChange={(e) => setName(e.target.value)} /></label>
          <label>Caption font<input value={brand.font ?? ""} onChange={(e) => setBrand({ ...brand, font: e.target.value })} /></label>
          <label>Highlight color<input type="color" value={brand.accent ?? "#f5c542"} onChange={(e) => setBrand({ ...brand, accent: e.target.value })} /></label>
          <button onClick={async () => { try { await api("/api/settings", { method: "POST", json: { ...brand, name } }); setMsg("Saved. Applies to the next voice + visuals step."); reload(); } catch (e) { setMsg((e as Error).message); } }}>Save</button>
        </div>
        <p className="good">{msg}</p>
        <p className="mute" style={{ fontSize: 13 }}>Font must be installed on the worker machine. Intro/outro bumpers are not implemented yet.</p>
      </div>
    </>
  );
}
