"use client";
import { useState } from "react";
import { api, useApi } from "@/lib/client";

const STYLES = [
  ["explained_simply", "Explained simply"], ["myth_vs_reality", "Myth vs reality"],
  ["seven_habits", "Listicle / habits"], ["story_motivation", "Story-driven motivation"],
];

export default function Studio() {
  const projects = useApi<{ projects: any[] }>("/api/projects", 5000);
  const accepted = useApi<{ clips: any[] }>("/api/clips?status=accepted");
  const [f, setF] = useState<any>({ format: "short", style: "explained_simply" });
  const [picked, setPicked] = useState<string[]>([]);
  const [err, setErr] = useState("");

  async function create(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { project } = await api("/api/projects", { method: "POST", json: { title: f.title, format: f.format, topic: f.topic || f.title, clipIds: picked } });
      await api(`/api/projects/${project.id}/script`, { method: "POST", json: { style: f.style } });
      window.location.href = `/studio/${project.id}`;
    } catch (e2) { setErr((e2 as Error).message); }
  }

  return (
    <>
      <h1>Studio</h1>
      <form className="card" onSubmit={create}>
        <h2>New video</h2>
        <div className="grid">
          <label>Title / working name<input required value={f.title ?? ""} onChange={(e) => setF({ ...f, title: e.target.value })} /></label>
          <label>Topic (what it is about)<input value={f.topic ?? ""} onChange={(e) => setF({ ...f, topic: e.target.value })} placeholder="e.g. why cash loses value to inflation" /></label>
          <label>Format<select value={f.format} onChange={(e) => setF({ ...f, format: e.target.value })}><option value="short">Short (under 60s)</option><option value="long">Long-form (8–12 min)</option></select></label>
          <label>Style<select value={f.style} onChange={(e) => setF({ ...f, style: e.target.value })}>{STYLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        </div>
        {!!accepted.data?.clips.length && (
          <>
            <h2 style={{ marginTop: 14 }}>Use accepted clips as evidence (optional)</h2>
            {accepted.data.clips.map((c) => (
              <label key={c.id} style={{ flexDirection: "row", alignItems: "center", gap: 8, color: "var(--text)", fontSize: 14, marginBottom: 4 }}>
                <input type="checkbox" checked={picked.includes(c.id)} onChange={(e) => setPicked(e.target.checked ? [...picked, c.id] : picked.filter((x) => x !== c.id))} />
                {c.hook_text ?? "clip"} <span className="mute">· {c.source_title} · {c.rights_status}</span>
              </label>
            ))}
          </>
        )}
        <div style={{ marginTop: 12 }}><button type="submit">Create and draft script</button> <span className="err">{err}</span></div>
      </form>

      <div className="card">
        <h2>Projects</h2>
        <table>
          <thead><tr><th>Title</th><th>Format</th><th>Status</th></tr></thead>
          <tbody>
            {(projects.data?.projects ?? []).map((p) => (
              <tr key={p.id}><td><a href={`/studio/${p.id}`}>{p.title}</a></td><td>{p.format}</td><td><span className={`pill ${["approved", "scheduled", "published"].includes(p.status) ? "ok" : p.status === "draft" ? "" : "warn"}`}>{p.status}</span></td></tr>
            ))}
            {projects.data && !projects.data.projects.length && <tr><td colSpan={3} className="mute">No projects yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
