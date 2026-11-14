"use client";
import { use, useEffect, useState } from "react";
import { api, useApi, usd } from "@/lib/client";

const STYLES = ["explained_simply", "myth_vs_reality", "seven_habits", "story_motivation"];

export default function Project({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const proj = useApi<any>(`/api/projects/${id}`, 4000);
  const jobs = useApi<{ jobs: any[] }>(`/api/jobs?project=${id}`, 3000);
  const [draft, setDraft] = useState<any>(null);
  const [style, setStyle] = useState("explained_simply");
  const [feedback, setFeedback] = useState("");
  const [msg, setMsg] = useState("");
  const [src, setSrc] = useState<Record<string, string>>({});

  const d = proj.data;
  const script = d?.script;
  // Load the latest script into the editor unless the user has unsaved edits.
  useEffect(() => { if (script && (!draft || draft.__v !== script.version)) setDraft({ ...script.body, __v: script.version }); }, [script, draft]);

  const run = async (type: string, payload: any = {}) => {
    try { await api("/api/jobs", { method: "POST", json: { type, payload: { projectId: id, ...payload } } }); setMsg(`${type.replace("_", " ")} queued`); jobs.reload(); } catch (e) { setMsg((e as Error).message); }
  };
  const saveScript = async () => {
    const { __v, ...body } = draft;
    try { await api(`/api/projects/${id}/script`, { method: "POST", json: { body } }); setMsg("Saved as a new version"); proj.reload(); } catch (e) { setMsg((e as Error).message); }
  };
  const resolve = async (itemId: string) => {
    try { await api(`/api/scripts/${script.id}/facts/${itemId}`, { method: "POST", json: { source: src[itemId] } }); setMsg("Resolved"); proj.reload(); } catch (e) { setMsg((e as Error).message); }
  };

  if (!d) return <p className="mute">Loading…</p>;
  const active = (jobs.data?.jobs ?? []).filter((j) => ["queued", "running"].includes(j.state));
  const final = d.renders.find((r: any) => r.kind === "final");
  const preview = d.renders.find((r: any) => r.kind === "preview");
  const watch = final ?? preview;
  const items = script?.fact_check_items ?? [];

  return (
    <>
      <h1>{d.project.title} <span className="pill">{d.project.format}</span> <span className="pill warn">{d.project.status}</span></h1>
      <p className="mute">Spent on this video: {usd(d.costUsd)} {active.length > 0 && <span className="pill warn">{active.map((j) => j.type).join(", ")} running…</span>}</p>
      {msg && <p className="good">{msg}</p>}

      <div className="card">
        <h2>Pipeline</h2>
        <div className="row">
          <select value={style} onChange={(e) => setStyle(e.target.value)}>{STYLES.map((s) => <option key={s}>{s}</option>)}</select>
          <input placeholder="Feedback for the rewrite (optional)" value={feedback} onChange={(e) => setFeedback(e.target.value)} style={{ flex: 1, minWidth: 160 }} />
          <button onClick={() => run("generate_script", { style, feedback: feedback || undefined })}>{script ? "Regenerate script" : "Generate script"}</button>
        </div>
        <div className="row" style={{ marginTop: 10 }}>
          <button disabled={!script || d.blockers.length > 0} onClick={() => run("assemble_project")}>1. Voice + visuals</button>
          <button className="sec" disabled={!script || d.blockers.length > 0} onClick={() => run("render_project", { kind: "preview" })}>2. Preview render</button>
          <button className="sec" disabled={!script || d.blockers.length > 0} onClick={() => run("render_project", { kind: "final" })}>3. Final render</button>
          <button className="sec" disabled={!final} onClick={() => run("package_project")}>4. Title, thumbnails, SEO</button>
          <button disabled={!script} onClick={async () => { await api(`/api/projects/${id}/produce`, { method: "POST" }); setMsg("Pipeline queued: runs to “ready for review”"); jobs.reload(); }}>Run everything</button>
          <a className="btn" href="/queue" style={{ marginLeft: "auto" }}>5. Review &amp; approve →</a>
        </div>
        {d.blockers.length > 0 && <div style={{ marginTop: 10 }}>{d.blockers.map((b: string) => <div key={b} className="err">⛔ {b}</div>)}</div>}
      </div>

      {watch && <div className="card"><h2>{watch.kind === "final" ? "Final render" : "Preview"}</h2><video src={`/api/media/${watch.storage_key}`} controls playsInline style={{ maxWidth: 360 }} /></div>}

      {items.length > 0 && (
        <div className="card">
          <h2>Fact-check ({items.filter((i: any) => !i.resolved).length} open)</h2>
          {items.map((i: any) => (
            <div key={i.id} className="row" style={{ marginBottom: 8 }}>
              <span className={`pill ${i.resolved ? "ok" : i.kind === "policy" ? "bad" : "warn"}`}>{i.kind}</span>
              <span style={{ flex: 1, minWidth: 200 }}>{i.text}{i.source && <div className="mute" style={{ fontSize: 12 }}>Source: {i.source}</div>}</span>
              {!i.resolved && i.kind !== "policy" && <><input placeholder="Source / citation" value={src[i.id] ?? ""} onChange={(e) => setSrc({ ...src, [i.id]: e.target.value })} /><button onClick={() => resolve(i.id)}>Resolve</button></>}
              {!i.resolved && i.kind === "policy" && <span className="mute">Edit the script to fix</span>}
            </div>
          ))}
        </div>
      )}

      {draft && (
        <div className="card">
          <h2>Script v{script.version}</h2>
          <label>Hook<textarea value={draft.hook} onChange={(e) => setDraft({ ...draft, hook: e.target.value })} /></label>
          <label>Promise<textarea value={draft.promise} onChange={(e) => setDraft({ ...draft, promise: e.target.value })} /></label>
          {draft.beats.map((b: any, i: number) => (
            <div key={i} style={{ marginTop: 10 }}>
              <label>Beat {i + 1}<textarea value={b.narration} onChange={(e) => setDraft({ ...draft, beats: draft.beats.map((x: any, j: number) => (j === i ? { ...x, narration: e.target.value } : x)) })} /></label>
              <div className="row"><label>On-screen text<input value={b.on_screen_text ?? ""} onChange={(e) => setDraft({ ...draft, beats: draft.beats.map((x: any, j: number) => (j === i ? { ...x, on_screen_text: e.target.value || undefined } : x)) })} /></label><label>Visual search<input value={b.visual_query} onChange={(e) => setDraft({ ...draft, beats: draft.beats.map((x: any, j: number) => (j === i ? { ...x, visual_query: e.target.value } : x)) })} /></label></div>
            </div>
          ))}
          <label style={{ marginTop: 10 }}>Call to action<textarea value={draft.cta} onChange={(e) => setDraft({ ...draft, cta: e.target.value })} /></label>
          <div style={{ marginTop: 10 }}><button onClick={saveScript}>Save as new version</button></div>
        </div>
      )}

      {d.packaging && (
        <div className="card">
          <h2>Packaging</h2>
          {d.packaging.chosen_title ? <p><strong>{d.packaging.chosen_title}</strong> <span className="pill ok">promise check passed</span></p> : <p className="err">No title passed the promise-delivery check. Regenerate or edit the script.</p>}
          <table><tbody>{(d.packaging.promise_check ?? []).map((c: any) => <tr key={c.title}><td>{c.title}</td><td>{c.ok ? <span className="pill ok">delivers</span> : <span className="pill bad">{c.issues.join("; ") || "no"}</span>}</td></tr>)}</tbody></table>
          <div className="row" style={{ margin: "10px 0" }}>
            {(d.packaging.thumbnail_concepts ?? []).map((t: any) => <div key={t.key}><img src={`/api/media/${t.key}`} alt={t.text} style={{ width: 240, borderRadius: 6 }} /><div className="mute" style={{ fontSize: 12 }}>contrast {t.contrast}:1</div></div>)}
          </div>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 13 }} className="mute">{d.packaging.description}</pre>
        </div>
      )}
    </>
  );
}
