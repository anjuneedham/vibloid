/**
 * The Gold Journal thumbnails (1280x720 PNG), drawn in code: no stock photos, no logos, no real people, no fake headlines.
 *   pnpm exec tsx scripts/make-gold-thumbnail.ts <outDir>
 * A: "Ghost Bars" - 3 solid gold bars vs 5 dashed ghosts = 120 t reported vs ~201 t (63%) not announced. (120/321 = 37.4% ~ 3/8)
 * B: "Redacted Ledger" - generic ledger page, redaction bars, highlighter circle. Row labels are deliberately blank (no fake document).
 * Rules: only facts from the video; no prices, no "secret/leaked/crash"; no organisation names or marks.
 */
import fs from "node:fs";
import path from "node:path";
import { createCanvas, type SKRSContext2D } from "@napi-rs/canvas";

const OUT = path.resolve(process.argv[2] ?? "output/gold-journal");
fs.mkdirSync(OUT, { recursive: true });
const W = 1280, H = 720, SANS = "'DejaVu Sans', sans-serif", SERIF = "'DejaVu Serif', serif";
type Ctx = SKRSContext2D;
const rad = (d: number) => (d * Math.PI) / 180;

function fit(c: Ctx, s: string, font: string, size: number, maxW: number) {
  c.font = `bold ${size}px ${font}`;
  const w = c.measureText(s).width;
  return w > maxW ? Math.floor((size * maxW) / w) : size;
}
function text(c: Ctx, s: string, x: number, y: number, size: number, fill: string | CanvasGradient, o: { font?: string; align?: CanvasTextAlign; shadow?: [string, number, number] } = {}) {
  c.save(); c.font = `bold ${size}px ${o.font ?? SANS}`; c.textAlign = o.align ?? "left"; c.textBaseline = "alphabetic"; c.fillStyle = fill;
  if (o.shadow) { c.shadowColor = o.shadow[0]; c.shadowBlur = o.shadow[1]; c.shadowOffsetY = o.shadow[2]; }
  c.fillText(s, x, y); c.restore();
}
function trapezoid(c: Ctx, x: number, y: number, w: number, h: number, inset: number) {
  c.beginPath(); c.moveTo(x + inset, y); c.lineTo(x + w - inset, y); c.lineTo(x + w, y + h); c.lineTo(x, y + h); c.closePath();
}
function vignette(c: Ctx, cx: number, cy: number, r0: number, r1: number, a: number) {
  const g = c.createRadialGradient(cx, cy, r0, cx, cy, r1); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, `rgba(0,0,0,${a})`); c.fillStyle = g; c.fillRect(0, 0, W, H);
}
const lum = (hex: string) => { const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((u) => (u <= 0.03928 ? u / 12.92 : ((u + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
const contrast = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

function save(name: string, draw: (c: Ctx) => void, checks: [string, string][]) {
  const canvas = createCanvas(W, H), c = canvas.getContext("2d") as unknown as Ctx;
  draw(c);
  const buf = canvas.toBuffer("image/png"); fs.writeFileSync(path.join(OUT, name), buf);
  console.log(name, `${(buf.length / 1024).toFixed(0)} KB`, checks.map(([a, b]) => `${contrast(a, b).toFixed(1)}:1`).join(" "));
}

// ---------- A: Ghost Bars ----------
save("thumb-A-ghost-bars.png", (c) => {
  c.fillStyle = "#0B1020"; c.fillRect(0, 0, W, H);
  const bg = c.createRadialGradient(300, 250, 0, 300, 250, 700); bg.addColorStop(0, "#1A2238"); bg.addColorStop(1, "#0B1020"); c.fillStyle = bg; c.fillRect(0, 0, W, H);
  vignette(c, 640, 360, 380, 820, 0.55);
  // 8 bars: 3 solid (reported) + 5 ghosts (not announced)
  for (let i = 0; i < 8; i++) {
    const x = 64 + i * 146, y = 500, w = 128, h = 150;
    c.save();
    if (i < 3) {
      const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, "#FFD86A"); g.addColorStop(0.5, "#E3A821"); g.addColorStop(1, "#9A6A10");
      c.shadowColor = "#FFB800"; c.shadowBlur = 40; c.fillStyle = g; trapezoid(c, x, y, w, h, 18); c.fill(); c.shadowBlur = 0;
      c.globalAlpha = 0.7; c.fillStyle = "#FFF1B8"; c.beginPath(); c.moveTo(x + 18, y); c.lineTo(x + w - 18, y); c.lineTo(x + w - 22, y + 26); c.lineTo(x + 22, y + 26); c.closePath(); c.fill();
    } else {
      c.fillStyle = "rgba(200,214,235,0.06)"; trapezoid(c, x, y, w, h, 18); c.fill();
      c.globalAlpha = 0.85; c.strokeStyle = "#C9D6EA"; c.lineWidth = 4; c.setLineDash([10, 8]); trapezoid(c, x, y, w, h, 18); c.stroke();
    }
    c.restore();
  }
  c.strokeStyle = "#FFD86A"; c.lineWidth = 3; c.beginPath(); c.moveTo(493, 478); c.lineTo(493, 672); c.stroke();
  // the number
  const big = fit(c, "63%", SANS, 290, 640), g2 = c.createLinearGradient(0, 70, 0, 330); g2.addColorStop(0, "#FFE38A"); g2.addColorStop(1, "#F2B11C");
  text(c, "63%", 56, 335, big, g2, { shadow: ["rgba(255,184,0,0.55)", 30, 0] });
  const hs = Math.min(fit(c, "ANNOUNCED", SANS, 84, 520), 84);
  text(c, "NOT", 720, 170, hs, "#F2F4F8", { shadow: ["rgba(0,0,0,0.6)", 12, 4] });
  text(c, "ANNOUNCED", 720, 170 + hs * 1.1, hs, "#F2F4F8", { shadow: ["rgba(0,0,0,0.6)", 12, 4] });
  text(c, "321 TONNES  ·  Q3", 720, 170 + hs * 1.1 + 78, 40, "#9BA8C2");
}, [["#F2F4F8", "#0B1020"], ["#FFE38A", "#0B1020"]]);

// ---------- B: Redacted Ledger ----------
save("thumb-B-redacted-ledger.png", (c) => {
  c.fillStyle = "#0D0F14"; c.fillRect(0, 0, W, H);
  // page
  c.save(); c.translate(400, 380); c.rotate(rad(-6));
  c.shadowColor = "rgba(0,0,0,0.7)"; c.shadowBlur = 50; c.shadowOffsetY = 20;
  const pg = c.createLinearGradient(0, -300, 0, 300); pg.addColorStop(0, "#F3EBD6"); pg.addColorStop(1, "#E2D6B8"); c.fillStyle = pg; c.fillRect(-300, -300, 600, 600); c.shadowColor = "transparent";
  c.strokeStyle = "#C9BC9A"; c.lineWidth = 2; for (let y = -270; y <= 290; y += 64) { c.beginPath(); c.moveTo(-290, y); c.lineTo(290, y); c.stroke(); }
  c.globalAlpha = 0.25; c.fillStyle = "#2A2A2A"; c.fillRect(-260, -270, 520, 40); c.globalAlpha = 1;
  for (let i = 0; i < 3; i++) { c.globalAlpha = 0.92; c.fillStyle = "#D9A421"; c.fillRect(-260, -200 + i * 64, 520, 34); }
  c.globalAlpha = 1;
  for (let i = 3; i < 8; i++) {
    const y = -200 + i * 64;
    if (i === 5) { // lifted bar, glowing slot underneath
      const glow = c.createRadialGradient(0, y + 22, 0, 0, y + 22, 260); glow.addColorStop(0, "#FFC531"); glow.addColorStop(1, "rgba(255,197,49,0)");
      c.save(); c.shadowColor = "#FFB800"; c.shadowBlur = 60; c.fillStyle = glow; c.fillRect(-260, y, 520, 44); c.restore();
      c.save(); c.translate(0, y + 22 - 18); c.rotate(rad(4)); c.fillStyle = "#111111"; c.fillRect(-260, -22, 520, 44); c.restore();
    } else { c.fillStyle = "#111111"; c.fillRect(-260, y, 520, 44); }
  }
  c.restore();
  vignette(c, 420, 380, 250, 800, 0.7);
  // headline (right block)
  const size = fit(c, "ANNOUNCED", SERIF, 76, 490);
  const sh: [string, number, number] = ["rgba(0,0,0,0.7)", 14, 0];
  text(c, "NOBODY", 760, 150, size, "#F5F1E6", { font: SERIF, shadow: sh });
  text(c, "ANNOUNCED", 760, 150 + size * 1.12, size, "#F5F1E6", { font: SERIF, shadow: sh });
  text(c, "THIS", 760, 150 + size * 2.24, size, "#FFC531", { font: SERIF, shadow: sh });
  // kicker + highlighter circle + arrow
  text(c, "~200 TONNES", 1010, 500, fit(c, "~200 TONNES", SANS, 64, 400), "#FFFFFF", { align: "center" });
  c.save(); c.strokeStyle = "#FFE14D"; c.lineWidth = 12; c.globalAlpha = 0.9; c.lineCap = "round";
  c.beginPath(); c.ellipse(1010, 478, 220, 78, rad(-5), rad(-100), rad(250)); c.stroke(); c.restore();
  c.save(); c.strokeStyle = "#FFE14D"; c.fillStyle = "#FFE14D"; c.lineWidth = 10; c.lineCap = "round";
  c.beginPath(); c.moveTo(800, 520); c.quadraticCurveTo(720, 600, 646, 556); c.stroke();
  const a = Math.atan2(556 - 600, 646 - 720); c.translate(646, 556); c.rotate(a);
  c.beginPath(); c.moveTo(18, 0); c.lineTo(-16, -17); c.lineTo(-16, 17); c.closePath(); c.fill(); c.restore();
}, [["#F5F1E6", "#0D0F14"], ["#FFFFFF", "#0D0F14"]]);
