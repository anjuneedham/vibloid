import { spawn } from "node:child_process";
import { createCanvas, type SKRSContext2D } from "@napi-rs/canvas";
import type { Dataset, OhlcPoint, SeriesPoint } from "./datasets";

export type ChartSpec = { kind: "line" | "candles" | "bars" | "counter"; title?: string; accent?: string; bg?: string; unit?: string; hidePct?: boolean };

const GOLD = "#f5c542", GREEN = "#3ecf8e", RED = "#ff6b6b", MUTE = "#98a2b0";
const FONT = "Inter, 'DejaVu Sans', sans-serif";
const ease = (x: number) => 1 - Math.pow(1 - x, 3);
const fmt = (n: number) => (Math.abs(n) >= 1000 ? n.toLocaleString("en-US", { maximumFractionDigits: 0 }) : n.toFixed(2));

function values(ds: Dataset): number[] {
  return ds.kind === "ohlc" ? (ds.points as OhlcPoint[]).map((p) => p.c) : (ds.points as SeriesPoint[]).map((p) => p.v);
}

/** Pure drawing: one frame at progress p in [0,1]. Exported for tests. */
export function drawChartFrame(ctx: SKRSContext2D, W: number, H: number, ds: Dataset, spec: ChartSpec, p: number) {
  const portrait = H > W;
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, spec.bg ?? "#0b0d10"); bg.addColorStop(1, spec.bg ?? "#141a22");
  const GOLD_ = spec.accent ?? GOLD;
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  const title = spec.title ?? ds.name;
  ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.font = `700 ${Math.round(W / (portrait ? 14 : 22))}px ${FONT}`;
  ctx.fillText(title, W / 2, H * (portrait ? 0.215 : 0.21), W * 0.9);

  const first = ds.points[0] as any, last = ds.points[ds.points.length - 1] as any;
  ctx.fillStyle = MUTE; ctx.font = `500 ${Math.round(W / (portrait ? 28 : 44))}px ${FONT}`;
  ctx.fillText(`${first.t} → ${last.t}`, W / 2, H * (portrait ? 0.265 : 0.27));

  const vals = values(ds);
  const n = vals.length;
  const x0 = W * 0.17, x1 = W * 0.93, y0 = H * (portrait ? 0.32 : 0.33), y1 = H * (portrait ? 0.62 : 0.72);
  const lo0 = Math.min(...(ds.kind === "ohlc" ? (ds.points as OhlcPoint[]).map((q) => q.l) : vals));
  const lo = spec.kind === "bars" ? Math.min(0, lo0) : lo0;
  const hi = Math.max(...(ds.kind === "ohlc" ? (ds.points as OhlcPoint[]).map((q) => q.h) : vals));
  const pad = (hi - lo) * 0.08 || 1;
  const Y = (v: number) => y1 - ((v - (lo - pad)) / (hi - lo + 2 * pad)) * (y1 - y0);
  // Bars sit in equal slots (inset from the edges); lines and candles span the full width.
  const X = (i: number) => (spec.kind === "bars" ? x0 + ((i + 0.5) / n) * (x1 - x0) : x0 + (n === 1 ? 0 : (i / (n - 1)) * (x1 - x0)));
  const shown = Math.max(1, Math.min(n, Math.ceil(ease(p) * n)));
  const cur = vals[shown - 1];
  const pct = ((cur - vals[0]) / Math.abs(vals[0] || 1)) * 100;

  // light grid + axis labels
  ctx.strokeStyle = "rgba(255,255,255,.07)"; ctx.lineWidth = 2; ctx.fillStyle = MUTE; ctx.textAlign = "right"; ctx.font = `500 ${Math.round(W / 34)}px ${FONT}`;
  const axis = (v: number) => (hi - lo >= 50 ? Math.round(v).toLocaleString("en-US") : fmt(v));
  for (let g = 0; g <= 3; g++) { const gv = lo + ((hi - lo) * g) / 3, gy = Y(gv); ctx.beginPath(); ctx.moveTo(x0, gy); ctx.lineTo(x1, gy); ctx.stroke(); ctx.fillText(axis(gv), x0 - 10, gy + 6); }

  if (spec.kind === "counter") {
    const v = vals[0] + (vals[n - 1] - vals[0]) * ease(p);
    const pc = ((v - vals[0]) / Math.abs(vals[0] || 1)) * 100;
    ctx.textAlign = "center"; ctx.fillStyle = "#fff"; ctx.font = `800 ${Math.round(W / 6)}px ${FONT}`; ctx.fillText(fmt(v), W / 2, H * 0.46);
    ctx.fillStyle = pc >= 0 ? GREEN : RED; ctx.font = `700 ${Math.round(W / 12)}px ${FONT}`; ctx.fillText(`${pc >= 0 ? "+" : ""}${pc.toFixed(1)}%`, W / 2, H * 0.56);
  } else if (spec.kind === "candles" && ds.kind === "ohlc") {
    const pts = ds.points as OhlcPoint[], cw = Math.max(2, ((x1 - x0) / n) * 0.62);
    for (let i = 0; i < shown; i++) {
      const c = pts[i], up = c.c >= c.o, col = up ? GREEN : RED, cx = X(i);
      ctx.strokeStyle = col; ctx.lineWidth = Math.max(1.5, cw / 6); ctx.beginPath(); ctx.moveTo(cx, Y(c.h)); ctx.lineTo(cx, Y(c.l)); ctx.stroke();
      ctx.fillStyle = col; ctx.fillRect(cx - cw / 2, Math.min(Y(c.o), Y(c.c)), cw, Math.max(2, Math.abs(Y(c.o) - Y(c.c))));
    }
  } else if (spec.kind === "bars") {
    const bw = ((x1 - x0) / n) * 0.7;
    for (let i = 0; i < shown; i++) { const grow = i === shown - 1 ? ease((ease(p) * n) % 1 || 1) : 1; const top = Y(vals[i]), base = Y(Math.max(lo - pad, Math.min(0, lo))); ctx.fillStyle = vals[i] >= (vals[i - 1] ?? vals[i]) ? GREEN : RED; ctx.fillRect(X(i) - bw / 2, base - (base - top) * grow, bw, (base - top) * grow);
      if (n <= 8 && grow >= 1) { ctx.textAlign = "center"; ctx.fillStyle = "#fff"; ctx.font = `700 ${Math.round(W / 26)}px ${FONT}`; ctx.fillText(fmt(vals[i]), X(i), top - 12); ctx.fillStyle = MUTE; ctx.font = `500 ${Math.round(W / 36)}px ${FONT}`; ctx.fillText(String((ds.points[i] as any).t), X(i), y1 + H * 0.032); } }
  } else {
    // line (also the fallback for candles requested on a plain series)
    const area = ctx.createLinearGradient(0, y0, 0, y1); area.addColorStop(0, GOLD_ + "47"); area.addColorStop(1, GOLD_ + "00");
    ctx.beginPath(); ctx.moveTo(X(0), Y(vals[0])); for (let i = 1; i < shown; i++) ctx.lineTo(X(i), Y(vals[i]));
    ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.strokeStyle = GOLD_; ctx.lineWidth = Math.max(5, W / 160); ctx.shadowColor = GOLD_; ctx.shadowBlur = 24; ctx.stroke(); ctx.shadowBlur = 0;
    ctx.lineTo(X(shown - 1), y1); ctx.lineTo(X(0), y1); ctx.closePath(); ctx.fillStyle = area; ctx.fill();
    ctx.beginPath(); ctx.arc(X(shown - 1), Y(cur), Math.max(9, W / 90), 0, Math.PI * 2); ctx.fillStyle = "#fff"; ctx.fill();
    ctx.textAlign = "center"; ctx.fillStyle = "#fff"; ctx.font = `700 ${Math.round(W / 16)}px ${FONT}`;
    ctx.fillText(spec.hidePct ? `${fmt(cur)}${spec.unit ?? ""}` : `${fmt(cur)}  ${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`, Math.min(W * 0.72, Math.max(W * 0.28, X(shown - 1))), Math.max(y0 - 6, Y(cur) - W / 18));
  }

  // The source is always on screen: no unsourced numbers.
  ctx.textAlign = "center"; ctx.fillStyle = MUTE; ctx.font = `500 ${Math.round(W / (portrait ? 34 : 56))}px ${FONT}`;
  ctx.fillText(`Source: ${ds.source}${ds.as_of ? `, as of ${ds.as_of}` : ""}`, W / 2, y1 + H * 0.075, W * 0.92);
}

/** Render an animated chart mp4. Drawn at half resolution and upscaled (4x fewer pixels through the pipe). */
export async function renderChartVideo(o: { ds: Dataset; spec: ChartSpec; width: number; height: number; durationS: number; outPath: string; fps?: number }) {
  const fps = o.fps ?? 30, w = Math.round(o.width / 2 / 2) * 2, h = Math.round(o.height / 2 / 2) * 2;
  const frames = Math.max(2, Math.round(o.durationS * fps));
  const animFrames = Math.max(2, Math.round(frames * 0.85)); // draw in over 85% of the beat, then hold
  const canvas = createCanvas(w, h), ctx = canvas.getContext("2d");
  const ff = spawn("ffmpeg", ["-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${w}x${h}`, "-r", String(fps), "-i", "-", "-vf", `scale=${o.width}:${o.height}:flags=lanczos`,
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", "-r", String(fps), o.outPath]);
  let err = ""; ff.stderr.on("data", (d) => (err += d));
  const done = new Promise<void>((res, rej) => { ff.on("close", (c) => (c === 0 ? res() : rej(new Error("ffmpeg chart encode failed: " + err.slice(-400)))));  ff.on("error", rej); });
  // Frames are drawn at W/2 so font sizes (relative to W) were designed for the full canvas: scale the context instead.
  for (let f = 0; f < frames; f++) {
    ctx.save(); drawChartFrame(ctx as unknown as SKRSContext2D, w, h, o.ds, o.spec, Math.min(1, f / (animFrames - 1))); ctx.restore();
    if (!ff.stdin.write(canvas.data())) await new Promise((r) => ff.stdin.once("drain", r));
  }
  ff.stdin.end();
  await done;
}
