"use client";
import { useState } from "react";
import { api, useApi, usd } from "@/lib/client";

const RIGHTS = [
  ["own", "I own it"],
  ["licensed", "Licensed (e.g. Creative Commons, stock)"],
  ["permissioned", "I have the creator's written permission"],
  ["commentary_fair_use", "Commentary / fair use (reference only, nothing is downloaded)"],
];

export default function Library() {
  const { data, reload } = useApi<{ sources: any[] }>("/api/sources", 4000);
  const [mode, setMode] = useState<"link" | "upload">("link");
  const [f, setF] = useState<any>({ rights_status: "own" });
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const needsNote = f.rights_status !== "own";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      if (mode === "link") await api("/api/sources", { method: "POST", json: f });
      else {
        const fd = new FormData();
        if (!file) throw new Error("choose a file");
        fd.append("file", file);
        for (const k of ["rights_status", "license_note", "attribution", "title"]) if (f[k]) fd.append(k, f[k]);
        await api("/api/sources", { method: "POST", body: fd });
      }
      setMsg({ ok: true, t: "Added. Ingesting…" });
      setF({ rights_status: "own" }); setFile(null); reload();
    } catch (err) { setMsg({ ok: false, t: (err as Error).message }); }
  }

  return (
    <>
      <h1>Library</h1>
      <form className="card" onSubmit={submit}>
        <h2>Add a source</h2>
        <div className="row" style={{ marginBottom: 10 }}>
          <button type="button" className={mode === "link" ? "" : "sec"} onClick={() => setMode("link")}>Link</button>
          <button type="button" className={mode === "upload" ? "" : "sec"} onClick={() => setMode("upload")}>Upload</button>
        </div>
        <div className="grid">
          {mode === "link"
            ? <label>Video URL<input required type="url" placeholder="https://…" value={f.url ?? ""} onChange={(e) => setF({ ...f, url: e.target.value })} /></label>
            : <label>File<input required type="file" accept="video/*,audio/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></label>}
          <label>Title (optional)<input value={f.title ?? ""} onChange={(e) => setF({ ...f, title: e.target.value })} /></label>
          <label>Your rights to use this
            <select value={f.rights_status} onChange={(e) => setF({ ...f, rights_status: e.target.value })}>
              {RIGHTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          {needsNote && <label>License / permission note (required)<input required value={f.license_note ?? ""} onChange={(e) => setF({ ...f, license_note: e.target.value })} placeholder="e.g. CC-BY 4.0, or 'email from creator 2026-11-02'" /></label>}
          {(needsNote && mode === "link") && <label>Creator / attribution (required)<input required value={f.attribution ?? ""} onChange={(e) => setF({ ...f, attribution: e.target.value })} /></label>}
        </div>
        <p className="mute" style={{ fontSize: 13 }}>“Unknown” is not an option on purpose. Media is only copied to storage when you own it or hold a license/permission.</p>
        <button type="submit">Add source</button> {msg && <span className={msg.ok ? "good" : "err"}> {msg.t}</span>}
      </form>

      <div className="card">
        <h2>Sources</h2>
        <table>
          <thead><tr><th>Title</th><th>Rights</th><th>Status</th><th>Cost</th></tr></thead>
          <tbody>
            {(data?.sources ?? []).map((s) => (
              <tr key={s.id}>
                <td><a href={`/library/${s.id}`}>{s.title ?? s.url ?? s.storage_key}</a><div className="mute" style={{ fontSize: 12 }}>{s.type}{s.attribution ? ` · ${s.attribution}` : ""}</div></td>
                <td><span className="pill">{s.rights_status}</span></td>
                <td><span className={`pill ${s.status === "ready" ? "ok" : s.status === "failed" ? "bad" : "warn"}`}>{s.status}</span>{s.error && <div className="err" style={{ fontSize: 12 }}>{s.error}</div>}</td>
                <td>{usd(Number(s.cost_usd))}</td>
              </tr>
            ))}
            {data && !data.sources.length && <tr><td colSpan={4} className="mute">Nothing yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
