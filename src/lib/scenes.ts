import { spawn } from "node:child_process";
import { createCanvas, type SKRSContext2D } from "@napi-rs/canvas";

/** Fully code-drawn animation scenes (no footage). Palette = the "Andrew Builds" channel look from the TradeNotes content spec. */
export const PAL = {
  bg: "#0A0F1A", panel: "#141B2B", text: "#F5F7FA", amber: "#F2B01E", mute: "#8A97AD", win: "#22c55e", loss: "#ef4444",
  // The TradeNotes app's own colors (so the dashboard mock-up looks like the product)
  appBg: "#0b0f14", appPanel: "#121821", appBorder: "#1f2a37", appFg: "#e6edf3", appMute: "#8b98a5", accent: "#3b82f6",
};
const FONT = "Inter, 'DejaVu Sans', sans-serif";
export const SAMPLE_LABEL = "SAMPLE DATA · NOT REAL TRADES";

/** Per-scene look override, so each channel can have its own colors. */
export type Theme = { accent?: string; bg?: string };
export type Scene = (
  | { kind: "kinetic"; lines: { text: string; color?: "amber" | "text" | "loss" | "win" }[]; sub?: string; badge?: boolean }
  | { kind: "chips"; items: { t: string; k: "win" | "loss" }[]; caption?: string }
  | { kind: "sum"; won: number; lost: number; trades: number }
  | { kind: "kpis"; cards: { label: string; value: string; hint?: string; tone?: "win" | "loss" | "neutral"; flag?: boolean }[]; note?: string; title?: string }
  | { kind: "progress"; have: number; need: number; caption?: string }
  | { kind: "endcard"; title: string; tagline: string; small?: string }
  | { kind: "typing"; text: string; label?: string; caption?: string }
  | { kind: "checklist"; items: string[]; title?: string }
  | { kind: "dots"; total: number; label: string; caption?: string }
) & { theme?: Theme };

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));      // progress of t within [a,b]
const outCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const outBack = (x: number) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const money = (n: number) => `${n < 0 ? "-" : ""}$${Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

function rr(c: SKRSContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
function bg(c: SKRSContext2D, W: number, H: number) { c.fillStyle = PAL.bg; c.fillRect(0, 0, W, H); }
function text(c: SKRSContext2D, s: string, x: number, y: number, size: number, color: string, weight = 700, align: CanvasTextAlign = "center", maxW?: number) {
  c.font = `${weight} ${size}px ${FONT}`;
  if (maxW) { const w = c.measureText(s).width; if (w > maxW) { size = Math.floor((size * maxW) / w); c.font = `${weight} ${size}px ${FONT}`; } } // shrink, never squash
  c.fillStyle = color; c.textAlign = align; c.fillText(s, x, y);
}
/** Always-on label for anything that looks like app data. Placed in the top safe zone. */
function badge(c: SKRSContext2D, W: number, H: number, a = 1) {
  const s = SAMPLE_LABEL, size = Math.round(W / 36);
  c.save(); c.globalAlpha = a; c.font = `700 ${size}px ${FONT}`;
  const w = c.measureText(s).width + size * 2, h = size * 2.2, x = (W - w) / 2, y = H * 0.085;
  rr(c, x, y, w, h, h / 2); c.fillStyle = "rgba(242,176,30,.12)"; c.fill(); c.lineWidth = 3; c.strokeStyle = PAL.amber; c.stroke();
  text(c, s, W / 2, y + h * 0.66, size, PAL.amber, 700); c.restore();
}
const tone = (t?: string) => (t === "win" ? PAL.win : t === "loss" ? PAL.loss : PAL.appFg);
const col = (n?: string) => (n === "amber" ? PAL.amber : n === "loss" ? PAL.loss : n === "win" ? PAL.win : PAL.text);

/** Draw one frame. t = seconds into the scene, dur = scene length. Exported for tests. */
export function drawScene(c: SKRSContext2D, W: number, H: number, t: number, dur: number, s: Scene) {
  if (!s.theme) return drawSceneInner(c, W, H, t, dur, s);
  const saved = { ...PAL };                       // temporary palette override (scenes render one at a time)
  if (s.theme.accent) PAL.amber = s.theme.accent;
  if (s.theme.bg) PAL.bg = s.theme.bg;
  try { drawSceneInner(c, W, H, t, dur, s); } finally { Object.assign(PAL, saved); }
}

function drawSceneInner(c: SKRSContext2D, W: number, H: number, t: number, dur: number, s: Scene) {
  bg(c, W, H);
  const p = clamp(t / Math.max(0.5, dur));
  switch (s.kind) {
    case "kinetic": {
      const size = Math.round(W / 8.2), gap = size * 1.22, y0 = H * 0.36 - ((s.lines.length - 1) * gap) / 2;
      s.lines.forEach((ln, i) => {
        const a = seg(t, 0.08 + i * 0.22, 0.5 + i * 0.22), e = outBack(a);
        c.save(); c.globalAlpha = clamp(a * 1.6); text(c, ln.text, W / 2, y0 + i * gap + (1 - e) * size * 0.5, size, col(ln.color), 800, "center", W * 0.92); c.restore();
      });
      if (s.sub) { c.save(); c.globalAlpha = seg(t, 0.9, 1.3); text(c, s.sub, W / 2, y0 + s.lines.length * gap + size * 0.2, Math.round(W / 22), PAL.mute, 500, "center", W * 0.86); c.restore(); }
      if (s.badge) badge(c, W, H, seg(t, 0.4, 0.8));
      break;
    }
    case "chips": {
      badge(c, W, H);
      const n = s.items.length, cols = Math.min(5, n), rows = Math.ceil(n / cols), cw = (W * 0.86) / cols, ch = cw * 0.8, x0 = W * 0.07, y0 = H * 0.24;
      s.items.forEach((it, i) => {
        const a = seg(t, 0.15 + i * (dur * 0.5) / n, 0.15 + i * (dur * 0.5) / n + 0.35), e = outBack(a);
        const cx = x0 + (i % cols) * cw + cw / 2, cy = y0 + Math.floor(i / cols) * (ch + 22) + ch / 2, w = (cw - 18) * e, h = ch * e;
        if (a <= 0) return;
        c.save(); c.globalAlpha = clamp(a * 2); rr(c, cx - w / 2, cy - h / 2, w, h, 18); c.fillStyle = it.k === "win" ? "rgba(34,197,94,.16)" : "rgba(239,68,68,.16)"; c.fill();
        c.lineWidth = 4; c.strokeStyle = it.k === "win" ? PAL.win : PAL.loss; c.stroke();
        text(c, it.t, cx, cy + cw * 0.08, Math.round(cw * 0.24), it.k === "win" ? PAL.win : PAL.loss, 800, "center", w - 12); c.restore();
      });
      const shown = s.items.filter((_, i) => t > 0.15 + i * (dur * 0.5) / n + 0.2);
      const wins = shown.filter((i) => i.k === "win").length, losses = shown.length - wins;
      const yb = y0 + rows * (ch + 22) + H * 0.05;
      text(c, `${wins} wins`, W * 0.3, yb, Math.round(W / 10), PAL.win, 800); text(c, `${losses} losses`, W * 0.7, yb, Math.round(W / 10), PAL.loss, 800);
      if (s.caption) text(c, s.caption, W / 2, yb + H * 0.07, Math.round(W / 24), PAL.mute, 500, "center", W * 0.9);
      break;
    }
    case "sum": {
      badge(c, W, H);
      const net = s.won - s.lost, per = net / s.trades, pf = s.won / s.lost, maxV = Math.max(s.won, s.lost), bx = W * 0.08, bw = W * 0.84, bh = H * 0.065;
      const bar = (label: string, v: number, y: number, color: string, a: number) => {
        text(c, label, bx, y - 14, Math.round(W / 22), PAL.mute, 600, "left");
        rr(c, bx, y, bw, bh, 14); c.fillStyle = PAL.panel; c.fill();
        rr(c, bx, y, Math.max(2, (bw * v * a) / maxV), bh, 14); c.fillStyle = color; c.fill();
        text(c, money(Math.round(v * a)), bx + bw, y - 14, Math.round(W / 16), color, 800, "right");
      };
      bar("Won", s.won, H * 0.2, PAL.win, outCubic(seg(t, 0.1, 0.9)));
      bar("Lost", s.lost, H * 0.3, PAL.loss, outCubic(seg(t, 0.5, 1.3)));
      const n = seg(t, dur * 0.28, dur * 0.5);
      c.save(); c.globalAlpha = clamp(n * 2);
      text(c, "Net", W / 2, H * 0.405, Math.round(W / 22), PAL.mute, 600);
      text(c, money(Math.round(net * outCubic(n))), W / 2, H * 0.485, Math.round(W / 6), net < 0 ? PAL.loss : PAL.win, 800); c.restore();
      const q = seg(t, dur * 0.52, dur * 0.72); c.save(); c.globalAlpha = clamp(q * 2);
      rr(c, W * 0.08, H * 0.525, W * 0.4, H * 0.11, 18); c.fillStyle = PAL.panel; c.fill(); rr(c, W * 0.52, H * 0.525, W * 0.4, H * 0.11, 18); c.fill();
      text(c, "Expectancy / trade", W * 0.28, H * 0.55, Math.round(W / 30), PAL.mute, 600); text(c, money(per * outCubic(q)), W * 0.28, H * 0.61, Math.round(W / 13), per < 0 ? PAL.loss : PAL.win, 800);
      text(c, "Profit factor", W * 0.72, H * 0.55, Math.round(W / 30), PAL.mute, 600); text(c, (pf * outCubic(q)).toFixed(2), W * 0.72, H * 0.61, Math.round(W / 13), pf < 1 ? PAL.loss : PAL.win, 800); c.restore();
      break;
    }
    case "kpis": {
      badge(c, W, H);
      const x = W * 0.07, y = H * 0.16, w = W * 0.86, h = H * 0.475, e = outCubic(seg(t, 0, 0.4));
      c.save(); c.globalAlpha = e; rr(c, x, y + (1 - e) * 30, w, h, 26); c.fillStyle = PAL.appBg; c.fill(); c.lineWidth = 3; c.strokeStyle = PAL.appBorder; c.stroke();
      text(c, s.title ?? "Dashboard", x + 36, y + 70 + (1 - e) * 30, Math.round(W / 22), PAL.appFg, 700, "left");
      text(c, "TradeNotes", x + w - 36, y + 70 + (1 - e) * 30, Math.round(W / 34), PAL.accent, 700, "right"); c.restore();
      // The real app shows this notice above the KPI cards when there are fewer than 30 closed trades.
      let gridTop = y + h * 0.15;
      if (s.note) {
        const a = outCubic(seg(t, 0.35, 0.8)), fs = Math.round(W / 41), lines: string[] = [];
        c.font = `500 ${fs}px ${FONT}`; let cur = "";
        for (const word of s.note.split(" ")) { const tryLine = cur ? cur + " " + word : word; if (c.measureText(tryLine).width > w - 100 && cur) { lines.push(cur); cur = word; } else cur = tryLine; }
        lines.push(cur);
        const nh = fs * 1.5 * lines.length + 36;
        c.save(); c.globalAlpha = a; rr(c, x + 30, gridTop, w - 60, nh, 14); c.fillStyle = "rgba(59,130,246,.12)"; c.fill(); c.lineWidth = 2; c.strokeStyle = "rgba(59,130,246,.55)"; c.stroke();
        lines.forEach((ln, i) => text(c, ln, x + 56, gridTop + 18 + fs * 1.5 * (i + 0.8), fs, PAL.appFg, 500, "left")); c.restore();
        gridTop += nh + 22;
      }
      const cols = 2, cw = (w - 36 * 3) / cols, ch = Math.min(h * 0.3, (y + h - gridTop - 24 - 16) / 2);
      const t0 = s.note ? 0.9 : 0.35;
      s.cards.slice(0, 4).forEach((k, i) => {
        const a = seg(t, t0 + i * 0.28, t0 + 0.45 + i * 0.28), ee = outBack(a), cx = x + 36 + (i % cols) * (cw + 36), cy = gridTop + Math.floor(i / cols) * (ch + 16);
        if (a <= 0) return;
        c.save(); c.globalAlpha = clamp(a * 2); c.translate(cx + cw / 2, cy + ch / 2); c.scale(0.8 + 0.2 * ee, 0.8 + 0.2 * ee); c.translate(-(cx + cw / 2), -(cy + ch / 2));
        rr(c, cx, cy, cw, ch, 18); c.fillStyle = PAL.appPanel; c.fill(); c.lineWidth = 2; c.strokeStyle = PAL.appBorder; c.stroke();
        text(c, k.label, cx + 26, cy + ch * 0.27, Math.round(W / 34), PAL.appMute, 500, "left");
        text(c, k.value, cx + 26, cy + ch * 0.62, Math.round(W / 15), tone(k.tone), 700, "left", cw - 40);
        if (k.hint) text(c, k.hint, cx + 26, cy + ch * 0.88, Math.round(W / 46), PAL.appMute, 500, "left", cw - 40);
        c.restore();
      });
      break;
    }
    case "progress": {
      badge(c, W, H);
      const x = W * 0.07, w = W * 0.86, y = H * 0.34, cellW = (w - (s.need - 1) * 6) / s.need, fill = Math.round(s.have * outCubic(seg(t, 0.2, dur * 0.7)));
      text(c, `${fill} of ${s.need} closed trades`, W / 2, H * 0.26, Math.round(W / 14), PAL.text, 800);
      for (let i = 0; i < s.need; i++) { rr(c, x + i * (cellW + 6), y, cellW, H * 0.1, 8); c.fillStyle = i < fill ? PAL.amber : PAL.panel; c.fill(); }
      const a = seg(t, dur * 0.55, dur * 0.8); c.save(); c.globalAlpha = a;
      text(c, `${s.need - s.have} more to go`, W / 2, H * 0.52, Math.round(W / 18), PAL.mute, 600);
      if (s.caption) text(c, s.caption, W / 2, H * 0.6, Math.round(W / 26), PAL.amber, 700, "center", W * 0.84); c.restore();
      break;
    }
    case "typing": {
      const x = W * 0.07, w = W * 0.86, y = H * 0.26, h = H * 0.26, a = outCubic(seg(t, 0, 0.35));
      c.save(); c.globalAlpha = a;
      if (s.label) text(c, s.label.toUpperCase(), x, y - 22, Math.round(W / 30), PAL.mute, 700, "left");
      rr(c, x, y, w, h, 26); c.fillStyle = PAL.panel; c.fill(); c.lineWidth = 4; c.strokeStyle = PAL.amber; c.stroke(); c.restore();
      const n = Math.round(s.text.length * outCubic(seg(t, 0.35, dur * 0.7))), shown = s.text.slice(0, n);
      // wrap the typed text
      const fs = Math.round(W / 17); c.font = `700 ${fs}px ${FONT}`; const lines: string[] = []; let cur = "";
      for (const word of shown.split(" ")) { const tr = cur ? cur + " " + word : word; if (c.measureText(tr).width > w - 80 && cur) { lines.push(cur); cur = word; } else cur = tr; }
      lines.push(cur);
      lines.forEach((ln, i) => text(c, ln, x + 40, y + 20 + fs * 1.35 * (i + 1), fs, PAL.text, 700, "left"));
      if (Math.floor(t * 2.5) % 2 === 0 && n < s.text.length) { const last = lines[lines.length - 1]; c.font = `700 ${fs}px ${FONT}`; const cx = x + 40 + c.measureText(last).width + 6; c.fillStyle = PAL.amber; c.fillRect(cx, y + 20 + fs * 1.35 * lines.length - fs * 0.85, 6, fs * 0.95); }
      if (s.caption) { c.save(); c.globalAlpha = seg(t, dur * 0.7, dur * 0.92); text(c, s.caption, W / 2, y + h + H * 0.07, Math.round(W / 20), PAL.amber, 700, "center", W * 0.86); c.restore(); }
      break;
    }
    case "checklist": {
      if (s.title) text(c, s.title.toUpperCase(), W / 2, H * 0.2, Math.round(W / 13), PAL.text, 800, "center", W * 0.9);
      const rowH = H * 0.1, y0 = H * 0.28, x = W * 0.1;
      s.items.forEach((it, i) => {
        const a = seg(t, 0.2 + i * (dur * 0.22), 0.55 + i * (dur * 0.22)), e = outBack(a), tick = seg(t, 0.5 + i * (dur * 0.22), 0.8 + i * (dur * 0.22));
        if (a <= 0) return;
        const y = y0 + i * (rowH + 18);
        c.save(); c.globalAlpha = clamp(a * 2); rr(c, x, y + (1 - e) * 20, W * 0.8, rowH, 20); c.fillStyle = PAL.panel; c.fill();
        c.lineWidth = 3; c.strokeStyle = tick > 0.5 ? PAL.amber : "#26324a"; c.stroke();
        const bs = rowH * 0.5, bx = x + 28, by = y + (1 - e) * 20 + (rowH - bs) / 2;
        rr(c, bx, by, bs, bs, 10); c.lineWidth = 4; c.strokeStyle = tick > 0 ? PAL.amber : PAL.mute; c.stroke();
        if (tick > 0) { c.beginPath(); c.moveTo(bx + bs * 0.2, by + bs * 0.55); c.lineTo(bx + bs * 0.2 + bs * 0.22 * tick, by + bs * 0.55 + bs * 0.22 * tick); if (tick > 0.5) c.lineTo(bx + bs * 0.42 + bs * 0.45 * (tick - 0.5) * 2, by + bs * 0.77 - bs * 0.5 * (tick - 0.5) * 2); c.lineWidth = 6; c.lineCap = "round"; c.strokeStyle = PAL.amber; c.stroke(); }
        text(c, it, bx + bs + 28, y + (1 - e) * 20 + rowH * 0.64, Math.round(W / 17), PAL.text, 700, "left", W * 0.8 - bs - 90); c.restore();
      });
      break;
    }
    case "dots": {
      const n = s.total, r = Math.min(W * 0.065, (W * 0.8) / (n * 2.6)), gap = r * 2.6, x0 = W / 2 - ((n - 1) * gap) / 2, y = H * 0.36;
      const filled = Math.min(n, Math.floor(seg(t, 0.2, dur * 0.65) * (n + 0.999)));
      for (let i = 0; i < n; i++) {
        const a = seg(t, 0.2 + (i / n) * dur * 0.65, 0.2 + (i / n) * dur * 0.65 + 0.3), on = i < filled;
        c.beginPath(); c.arc(x0 + i * gap, y, r * (on ? 0.8 + 0.2 * outBack(a) : 0.8), 0, Math.PI * 2);
        if (on) { c.fillStyle = PAL.amber; c.fill(); } else { c.lineWidth = 5; c.strokeStyle = "#26324a"; c.stroke(); }
      }
      text(c, `${filled}/${n}`, W / 2, H * 0.5, Math.round(W / 6), PAL.text, 800);
      text(c, s.label, W / 2, H * 0.5 + W * 0.09, Math.round(W / 22), PAL.mute, 600, "center", W * 0.86);
      if (s.caption) { c.save(); c.globalAlpha = seg(t, dur * 0.6, dur * 0.85); text(c, s.caption, W / 2, H * 0.6, Math.round(W / 20), PAL.amber, 700, "center", W * 0.86); c.restore(); }
      break;
    }
    case "endcard": {
      const a = outCubic(seg(t, 0, 0.5));
      c.save(); c.globalAlpha = a; text(c, s.title, W / 2, H * 0.40 + (1 - a) * 24, Math.round(W / 9), PAL.text, 800, "center", W * 0.9);
      c.fillStyle = PAL.amber; c.fillRect(W * 0.38, H * 0.425, W * 0.24, 6);
      s.tagline.split(/(?<=\.)\s+/).forEach((ln, i) => text(c, ln, W / 2, H * 0.49 + i * W * 0.055, Math.round(W / 24), PAL.mute, 500, "center", W * 0.84)); c.restore();
      if (s.small) text(c, s.small, W / 2, H * 0.62, Math.round(W / 34), PAL.mute, 500, "center", W * 0.86);
      break;
    }
  }
}

/** Render a scene to mp4 (drawn at half size, upscaled). */
export async function renderSceneVideo(o: { scene: Scene; width: number; height: number; durationS: number; outPath: string; fps?: number }) {
  const fps = o.fps ?? 30, w = Math.round(o.width / 2 / 2) * 2, h = Math.round(o.height / 2 / 2) * 2, frames = Math.max(2, Math.round(o.durationS * fps));
  const canvas = createCanvas(w, h), ctx = canvas.getContext("2d") as unknown as SKRSContext2D;
  const ff = spawn("ffmpeg", ["-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${w}x${h}`, "-r", String(fps), "-i", "-", "-vf", `scale=${o.width}:${o.height}:flags=lanczos`,
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", "-r", String(fps), o.outPath]);
  let err = ""; ff.stderr.on("data", (d) => (err += d));
  const done = new Promise<void>((res, rej) => { ff.on("close", (code) => (code === 0 ? res() : rej(new Error("ffmpeg scene encode failed: " + err.slice(-400))))); ff.on("error", rej); });
  for (let f = 0; f < frames; f++) {
    ctx.setTransform(w / o.width, 0, 0, h / o.height, 0, 0);
    drawScene(ctx, o.width, o.height, f / fps, o.durationS, o.scene);
    if (!ff.stdin.write(canvas.data())) await new Promise((r) => ff.stdin.once("drain", r));
  }
  ff.stdin.end();
  await done;
}
