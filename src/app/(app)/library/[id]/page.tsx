"use client";
import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, useApi, mmss } from "@/lib/client";

type Clip = { id: string; start_s: string; end_s: string; score: number | null; hook_text: string | null; reason: string | null; risk_flags: string[]; status: string; sub_scores: any };

export default function SourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const src = useApi<any>(`/api/sources/${id}`, 4000);
  const clips = useApi<{ clips: Clip[] }>(`/api/sources/${id}/clips`, 4000);
  const video = useRef<HTMLVideoElement>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [now, setNow] = useState(0);
  const [format, setFormat] = useState("short");
  const [feedback, setFeedback] = useState("");
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [err, setErr] = useState("");

  const source = src.data?.source;
  const words: { w: string; start: number; end: number }[] = src.data?.words ?? [];
  const list = clips.data?.clips ?? [];
  const selected = list.find((c) => c.id === sel) ?? null;
  const dur = Number(source?.duration_s ?? words[words.length - 1]?.end ?? 1);

  const patch = useCallback(async (cid: string, body: any) => {
    try { await api(`/api/clips/${cid}`, { method: "PATCH", json: body }); clips.reload(); setErr(""); } catch (e) { setErr((e as Error).message); }
  }, [clips]);

  // Keyboard shortcuts for the selected clip (ignored while typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName) || !selected) {
        if (!selected && (e.key === "j" || e.key === "k") && list.length) setSel(list[0].id);
        return;
      }
      const cur = video.current?.currentTime ?? 0;
      const i = list.findIndex((c) => c.id === selected.id);
      const step = e.shiftKey ? 1 : 0.1;
      if (e.key === "i") patch(selected.id, { start_s: Math.min(cur, Number(selected.end_s) - 0.5) });
      else if (e.key === "o") patch(selected.id, { end_s: Math.max(cur, Number(selected.start_s) + 0.5) });
      else if (e.key === "a") patch(selected.id, { status: "accepted" });
      else if (e.key === "x") setRejecting(selected.id);
      else if (e.key === "j") setSel(list[Math.min(list.length - 1, i + 1)].id);
      else if (e.key === "k") setSel(list[Math.max(0, i - 1)].id);
      else if (e.key === ",") patch(selected.id, { start_s: Math.max(0, Number(selected.start_s) - step) });
      else if (e.key === ".") patch(selected.id, { end_s: Number(selected.end_s) + step });
      else if (e.key === "p") { if (video.current) { video.current.currentTime = Number(selected.start_s); video.current.play(); } }
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, list, patch]);

  // Stop playback at the end of the selected clip.
  useEffect(() => {
    const v = video.current; if (!v) return;
    const h = () => { setNow(v.currentTime); if (selected && v.currentTime >= Number(selected.end_s) && !v.paused && v.dataset.clipPlay === "1") { v.pause(); v.dataset.clipPlay = "0"; } };
    v.addEventListener("timeupdate", h);
    return () => v.removeEventListener("timeupdate", h);
  }, [selected]);

  const seek = (t: number) => { if (video.current) video.current.currentTime = t; };
  const playClip = (c: Clip) => { setSel(c.id); const v = video.current; if (v) { v.dataset.clipPlay = "1"; v.currentTime = Number(c.start_s); v.play(); } };
  const inClip = useMemo(() => (t: number) => selected && t >= Number(selected.start_s) && t <= Number(selected.end_s), [selected]);

  async function find() {
    try { await api(`/api/sources/${id}/clips`, { method: "POST", json: { format, feedback: feedback || undefined } }); setFeedback(""); setErr(""); } catch (e) { setErr((e as Error).message); }
  }

  if (!source) return <p className="mute">Loading…</p>;
  const playable = source.status === "ready" && source.storage_key;

  return (
    <>
      <h1>{source.title ?? source.url ?? "Source"}</h1>
      <p className="mute"><span className="pill">{source.rights_status}</span> {source.attribution && `· ${source.attribution}`} · <span className={`pill ${playable ? "ok" : "warn"}`}>{source.status}</span> {source.error && <span className="err">{source.error}</span>}</p>
      {source.status === "reference_only" && <div className="card">Reference-only source: no media was downloaded because the rights status does not allow copying. Upload the file yourself if you hold the rights.</div>}

      {playable && (
        <div className="card">
          <video ref={video} src={`/api/media/${source.storage_key}`} controls preload="metadata" />
          <div className="wave" style={{ backgroundImage: `url(/api/media/sources/${id}/waveform.png)` }} onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); seek(((e.clientX - r.left) / r.width) * dur); }}>
            {list.filter((c) => c.status !== "rejected").map((c) => (
              <div key={c.id} className={`reg ${c.id === sel ? "sel" : ""}`} style={{ left: `${(Number(c.start_s) / dur) * 100}%`, width: `${((Number(c.end_s) - Number(c.start_s)) / dur) * 100}%` }} />
            ))}
            <div className="head" style={{ left: `${(now / dur) * 100}%` }} />
          </div>
          <div className="mute" style={{ fontSize: 12 }}>Shortcuts (with a clip selected): <kbd>i</kbd> set in · <kbd>o</kbd> set out · <kbd>,</kbd>/<kbd>.</kbd> nudge start/end (hold <kbd>Shift</kbd> for 1s) · <kbd>a</kbd> accept · <kbd>x</kbd> reject · <kbd>p</kbd> play clip · <kbd>j</kbd>/<kbd>k</kbd> next/prev</div>
        </div>
      )}

      <div className="card">
        <h2>Find clips</h2>
        <div className="row">
          <select value={format} onChange={(e) => setFormat(e.target.value)}><option value="short">Shorts (15–60s)</option><option value="long">Long-form segments (60–180s)</option></select>
          <input style={{ flex: 1, minWidth: 200 }} placeholder="Optional feedback, e.g. 'more story, less jargon'" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
          <button disabled={source.status !== "ready"} onClick={find}>{list.length ? "Regenerate" : "Find clips"}</button>
        </div>
        {err && <p className="err">{err}</p>}
      </div>

      <div className="grid">
        {list.map((c) => (
          <div key={c.id} className="card" style={{ outline: c.id === sel ? "2px solid var(--accent)" : "none", opacity: c.status === "rejected" ? 0.5 : 1 }} onClick={() => setSel(c.id)}>
            <div className="row"><strong>{c.score ?? "–"}</strong><span className={`pill ${c.status === "accepted" ? "ok" : c.status === "rejected" ? "bad" : ""}`}>{c.status}</span>{c.risk_flags.map((f) => <span key={f} className="pill warn">{f}</span>)}</div>
            <p style={{ margin: "8px 0" }}>{c.hook_text}</p>
            <p className="mute" style={{ fontSize: 13 }}>{c.reason}</p>
            <div className="row">
              <label>Start<input type="number" step="0.1" value={Number(c.start_s)} onChange={(e) => patch(c.id, { start_s: Number(e.target.value) })} style={{ width: 90 }} /></label>
              <label>End<input type="number" step="0.1" value={Number(c.end_s)} onChange={(e) => patch(c.id, { end_s: Number(e.target.value) })} style={{ width: 90 }} /></label>
              <span className="mute">{mmss(Number(c.end_s) - Number(c.start_s))} long</span>
            </div>
            <input type="range" min={0} max={dur} step={0.1} value={Number(c.start_s)} onChange={(e) => patch(c.id, { start_s: Math.min(Number(e.target.value), Number(c.end_s) - 0.5) })} style={{ width: "100%" }} aria-label="start" />
            <input type="range" min={0} max={dur} step={0.1} value={Number(c.end_s)} onChange={(e) => patch(c.id, { end_s: Math.max(Number(e.target.value), Number(c.start_s) + 0.5) })} style={{ width: "100%" }} aria-label="end" />
            <div className="row">
              <button className="sec" onClick={() => playClip(c)}>Play</button>
              <button className="ok" onClick={() => patch(c.id, { status: "accepted" })}>Accept</button>
              <button className="bad" onClick={() => setRejecting(c.id)}>Reject</button>
            </div>
            {rejecting === c.id && (
              <div className="row" style={{ marginTop: 8 }}>
                <input autoFocus style={{ flex: 1 }} placeholder="Why? (used to improve the next pass)" value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { patch(c.id, { status: "rejected", reject_feedback: rejectNote || undefined }); setRejecting(null); setRejectNote(""); } if (e.key === "Escape") setRejecting(null); }} />
                <button onClick={() => { patch(c.id, { status: "rejected", reject_feedback: rejectNote || undefined }); setRejecting(null); setRejectNote(""); }}>Reject</button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="card">
        <h2>Transcript {src.data?.provider && <span className="mute">({src.data.provider})</span>}</h2>
        <p className="mute" style={{ fontSize: 12 }}>Click a word to seek.</p>
        <div className="words">
          {words.map((w, i) => <span key={i} className={`${inClip(w.start) ? "in" : ""} ${now >= w.start && now < w.end ? "now" : ""}`} onClick={() => seek(w.start)}>{w.w} </span>)}
        </div>
      </div>
    </>
  );
}
