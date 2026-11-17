/**
 * The Gold Journal thumbnails (1280x720 PNG), drawn in code: no stock photos, no logos, no real people, no fake headlines.
 *   pnpm exec tsx scripts/make-gold-thumbnail.ts <outDir>
 * Writes thumb-A-not-announced.png (recommended) and thumb-B-321-tonnes.png for an A/B test.
 */
import fs from "node:fs";
import path from "node:path";
import { createCanvas, type SKRSContext2D } from "@napi-rs/canvas";

const OUT = path.resolve(process.argv[2] ?? "output/gold-journal");
fs.mkdirSync(OUT, { recursive: true });
const W = 1280, H = 720, SANS = "'DejaVu Sans', sans-serif", SERIF = "'DejaVu Serif', serif";

function bar(c: SKRSContext2D, x: number, y: number, w: number, h: number) {
  const inset = w * 0.12;
  const g = c.createLinearGradient(x, y, x, y + h); g.addColorStop(0, "#FBE39A"); g.addColorStop(0.45, "#E2B34F"); g.addColorStop(1, "#A97A22");
  c.save(); c.shadowColor = "rgba(0,0,0,0.55)"; c.shadowBlur = 28; c.shadowOffsetY = 14;
  c.beginPath(); c.moveTo(x + inset, y); c.lineTo(x + w - inset, y); c.lineTo(x + w, y + h); c.lineTo(x, y + h); c.closePath(); c.fillStyle = g; c.fill(); c.restore();
  c.beginPath(); c.moveTo(x + inset, y); c.lineTo(x + w - inset, y); c.lineTo(x + w - inset - 6, y + h * 0.18); c.lineTo(x + inset + 6, y + h * 0.18); c.closePath(); c.fillStyle = "rgba(255,248,214,0.75)"; c.fill();
  c.strokeStyle = "rgba(110,76,14,0.55)"; c.lineWidth = 3; c.beginPath(); c.moveTo(x + inset, y); c.lineTo(x + w - inset, y); c.lineTo(x + w, y + h); c.lineTo(x, y + h); c.closePath(); c.stroke();
  c.fillStyle = "rgba(110,76,14,0.5)"; c.font = `bold ${Math.round(h * 0.2)}px ${SANS}`; c.textAlign = "center"; c.fillText("AU 999.9", x + w / 2, y + h * 0.62);
}
function stack(c: SKRSContext2D, cx: number, baseY: number) {
  const w = 200, h = 84;
  bar(c, cx - w - 14, baseY - h, w, h); bar(c, cx + 14, baseY - h, w, h);
  bar(c, cx - w / 2, baseY - 2 * h - 12, w, h);
}
function base(c: SKRSContext2D) {
  const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, "#07090E"); g.addColorStop(1, "#151B28"); c.fillStyle = g; c.fillRect(0, 0, W, H);
  const glow = c.createRadialGradient(W * 0.76, H * 0.55, 0, W * 0.76, H * 0.55, 460); glow.addColorStop(0, "rgba(212,166,74,0.38)"); glow.addColorStop(1, "rgba(212,166,74,0)"); c.fillStyle = glow; c.fillRect(0, 0, W, H);
}
function text(c: SKRSContext2D, s: string, x: number, y: number, size: number, color: string, o: { font?: string; align?: CanvasTextAlign; stroke?: boolean } = {}) {
  c.font = `bold ${size}px ${o.font ?? SANS}`; c.textAlign = o.align ?? "left"; c.textBaseline = "alphabetic";
  if (o.stroke) { c.lineJoin = "round"; c.lineWidth = Math.max(8, size / 9); c.strokeStyle = "rgba(0,0,0,0.85)"; c.strokeText(s, x, y); }
  c.fillStyle = color; c.fillText(s, x, y);
}
const lum = (hex: string) => { const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((u) => (u <= 0.03928 ? u / 12.92 : ((u + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
const contrast = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

function save(name: string, draw: (c: SKRSContext2D) => void, fg: string, bg: string) {
  const canvas = createCanvas(W, H), c = canvas.getContext("2d") as unknown as SKRSContext2D;
  base(c); draw(c);
  const buf = canvas.toBuffer("image/png"); fs.writeFileSync(path.join(OUT, name), buf);
  console.log(name, `${(buf.length / 1024).toFixed(0)} KB`, `text contrast ${contrast(fg, bg).toFixed(1)}:1`);
}

// A: the curiosity-gap version (recommended)
save("thumb-A-not-announced.png", (c) => {
  text(c, "NOT", 60, 300, 230, "#F0CB78", { stroke: true });
  text(c, "ANNOUNCED", 60, 470, 128, "#FFFFFF", { stroke: true });
  c.fillStyle = "#D4A64A"; c.fillRect(66, 510, 150, 8);
  text(c, "What central banks bought in Q3", 66, 580, 40, "#C9CEDA");
  stack(c, 1040, 690);
}, "#FFFFFF", "#0B0E15");

// B: the number version
save("thumb-B-321-tonnes.png", (c) => {
  text(c, "321", 60, 330, 280, "#F0CB78", { font: SERIF, stroke: true });
  text(c, "TONNES", 70, 470, 150, "#FFFFFF", { stroke: true });
  c.fillStyle = "#D4A64A"; c.fillRect(76, 510, 150, 8);
  text(c, "bought by central banks in Q3", 76, 580, 42, "#C9CEDA");
  stack(c, 1040, 690);
}, "#FFFFFF", "#0B0E15");
