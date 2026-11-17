/**
 * The Gold Journal: animated explainer renderer (canvas frames -> ffmpeg). No footage, no AI images, no API keys.
 * One drawn visual per narration paragraph; every number on screen comes from specs/gold-journal/sources_and_checks.md.
 *
 *   pnpm exec tsx scripts/make-gold-journal.ts --out <dir>                       # silent read-along preview (timing estimated at 140 wpm)
 *   pnpm exec tsx scripts/make-gold-journal.ts --out <dir> --audio voice.mp3      # re-times everything to the real voiceover and muxes it
 *   pnpm exec tsx scripts/make-gold-journal.ts --out <dir> --audio-dir segs/      # p00.mp3 ... p32.mp3, one per paragraph (exact sync)
 * Options: --no-burn (no burned-in captions), --fps 30, --wpm 140, --max-seconds N (render only the first N seconds, for previews).
 * Outputs: gold-journal-<slug>.mp4, .srt, .vtt, timing.json
 */
import fs from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { createCanvas, type SKRSContext2D } from "@napi-rs/canvas";

const arg = (n: string) => { const i = process.argv.indexOf("--" + n); return i >= 0 ? process.argv[i + 1] : undefined; };
const flag = (n: string) => process.argv.includes("--" + n);
const OUT = path.resolve(arg("out") ?? "output/gold-journal");
const FPS = Number(arg("fps") ?? 30), WPM = Number(arg("wpm") ?? 140), MAX_S = Number(arg("max-seconds") ?? 0);
const SLUG = "central-banks-q3-2026";
const W = 1920, H = 1080;
fs.mkdirSync(OUT, { recursive: true });

const C = { bg: "#0B0D12", bg2: "#171C27", panel: "#1A202D", line: "#2A3242", gold: "#D4A64A", goldHi: "#F0CB78", text: "#F3EFE6", mute: "#8E93A0", red: "#D9694F", green: "#74C69D" };
const SERIF = "'DejaVu Serif', serif", SANS = "'DejaVu Sans', sans-serif";
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
const fmt = (n: number, d = 0) => n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

type Ctx = SKRSContext2D;
const SRC = {
  wgc: "Source: World Gold Council, Gold Demand Trends Q3 2026",
  kitco: "Source: Kitco's summary of the World Gold Council Q3 2026 report",
  calc: "Our arithmetic from World Gold Council figures",
  quote: "World Gold Council report, as quoted by Kitco",
};

// ---------- drawing primitives ----------
function txt(c: Ctx, s: string, x: number, y: number, o: { size?: number; font?: string; color?: string; align?: CanvasTextAlign; weight?: string; alpha?: number; italic?: boolean } = {}) {
  c.save();
  c.globalAlpha = o.alpha ?? 1;
  c.fillStyle = o.color ?? C.text;
  c.font = `${o.italic ? "italic " : ""}${o.weight ?? "normal"} ${o.size ?? 40}px ${o.font ?? SANS}`;
  c.textAlign = o.align ?? "left"; c.textBaseline = "alphabetic";
  c.fillText(s, x, y);
  c.restore();
}
function wrap(c: Ctx, s: string, maxW: number, size: number, font = SANS, weight = "normal", italic = false) {
  c.save(); c.font = `${italic ? "italic " : ""}${weight} ${size}px ${font}`;
  const lines: string[] = []; let cur = "";
  for (const w of s.split(/\s+/)) { const t = cur ? cur + " " + w : w; if (c.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur); c.restore(); return lines;
}
function para(c: Ctx, s: string, x: number, y: number, maxW: number, o: { size?: number; font?: string; color?: string; align?: CanvasTextAlign; weight?: string; alpha?: number; italic?: boolean; lh?: number } = {}) {
  const size = o.size ?? 40, lh = o.lh ?? size * 1.35;
  const ls = wrap(c, s, maxW, size, o.font, o.weight, o.italic);
  ls.forEach((l, i) => txt(c, l, x, y + i * lh, o));
  return ls.length * lh;
}
function rr(c: Ctx, x: number, y: number, w: number, h: number, r: number, fill?: string, stroke?: string, lw = 2, alpha = 1) {
  c.save(); c.globalAlpha = alpha; c.beginPath();
  c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw; c.stroke(); } c.restore();
}
function background(c: Ctx, t: number) {
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#10141D"); g.addColorStop(1, C.bg);
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  const glow = c.createRadialGradient(W * 0.78, H * 0.18, 0, W * 0.78, H * 0.18, 700);
  glow.addColorStop(0, "rgba(212,166,74,0.13)"); glow.addColorStop(1, "rgba(212,166,74,0)");
  c.fillStyle = glow; c.fillRect(0, 0, W, H);
  // drifting gold dust, deterministic
  for (let i = 0; i < 60; i++) {
    const sx = (i * 977) % W, sp = 6 + (i * 13) % 14, r = 1 + (i % 3);
    const y = H + 20 - ((t * sp + i * 91) % (H + 40)), x = sx + Math.sin(t * 0.3 + i) * 18;
    c.fillStyle = `rgba(240,203,120,${0.10 + (i % 5) * 0.04})`; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  }
}
function chrome(c: Ctx, src?: string) {
  txt(c, "THE GOLD JOURNAL", 80, 84, { size: 26, color: C.gold, weight: "bold", font: SANS });
  c.fillStyle = C.gold; c.fillRect(80, 100, 64, 3);
  if (src) txt(c, src, W - 80, H - 64, { size: 22, color: C.mute, align: "right" });
}
const label = (c: Ctx, s: string, x: number, y: number, o: Parameters<typeof txt>[4] = {}) => txt(c, s, x, y, { size: 30, color: C.mute, ...o });

/** Horizontal bars growing from a baseline. items revealed one after another. */
function hbars(c: Ctx, t: number, items: { label: string; value: number; shown?: string; color?: string; sub?: string }[], o: { x: number; y: number; w: number; rowH?: number; max?: number; delay?: number; diverge?: boolean; labelW?: number }) {
  const rowH = o.rowH ?? 120, max = o.max ?? Math.max(...items.map((i) => Math.abs(i.value))), labelW = o.labelW ?? 420;
  const bx = o.x + labelW, bw = o.w - labelW - 40;
  const zero = o.diverge ? bx + bw / 2 : bx;
  if (o.diverge) { c.fillStyle = C.line; c.fillRect(zero - 1, o.y - 20, 3, rowH * items.length + 10); }
  items.forEach((it, i) => {
    const y = o.y + i * rowH, p = ease((t - i * (o.delay ?? 0.7) - 0.3) / 1.3);
    txt(c, it.label, o.x, y + rowH * 0.42, { size: 34, color: C.text, alpha: clamp(p * 2) });
    if (it.sub) txt(c, it.sub, o.x, y + rowH * 0.42 + 36, { size: 24, color: C.mute, alpha: clamp(p * 2) });
    const len = (Math.abs(it.value) / max) * (o.diverge ? bw / 2 : bw) * p;
    const col = it.color ?? C.gold;
    const x0 = o.diverge && it.value < 0 ? zero - len : zero;
    rr(c, x0, y + 8, Math.max(2, len), rowH * 0.5, 8, col);
    const lx = o.diverge && it.value < 0 ? x0 - 16 : x0 + len + 16;
    txt(c, it.shown ?? fmt(it.value), lx, y + 8 + rowH * 0.36, { size: 38, weight: "bold", color: C.text, align: o.diverge && it.value < 0 ? "right" : "left", alpha: clamp(p * 1.5) });
  });
}
const bigNumber = (c: Ctx, s: string, x: number, y: number, size: number, color = C.goldHi, align: CanvasTextAlign = "left") => txt(c, s, x, y, { size, color, weight: "bold", font: SERIF, align });
function title(c: Ctx, s: string, p = 1, y = 230) { para(c, s, 80, y, 1500, { size: 56, font: SERIF, color: C.text, alpha: clamp(p), lh: 74 }); }

// ---------- one visual per narration paragraph ----------
type Beat = { src?: string; draw: (c: Ctx, t: number, d: number) => void };
const notes = ["A record in a table is a record, not a recommendation.", "Buying nobody announced means the news is always behind the buying.", "Gold has costs: no income, storage and insurance, dealer spreads.", "Open the actual document. Read the row. Ask who is missing from it."];
const notePage = (k: number) => (c: Ctx, t: number) => {
  rr(c, 380, 150, 1160, 800, 14, "#F1E9D6"); c.fillStyle = "#D8CDB2";
  for (let i = 0; i < 9; i++) c.fillRect(430, 330 + i * 70, 1060, 2);
  txt(c, "What I wrote at the bottom of the page", 430, 240, { size: 40, font: SERIF, italic: true, color: "#2A2418", weight: "bold" });
  notes.slice(0, k + 1).forEach((n, i) => {
    const y = 322 + i * 150, p = i === k ? clamp(t / 4.5) : 1, shown = n.slice(0, Math.ceil(n.length * p));
    txt(c, `${i + 1}.`, 440, y, { size: 38, font: SERIF, color: "#8A6A1F", weight: "bold" });
    para(c, shown, 500, y, 960, { size: 34, font: SERIF, color: "#2A2418", lh: 46 });
  });
};

const BEATS: Beat[] = [
  /* 0 hook */ { src: SRC.wgc, draw: (c, t) => { const p = ease(t / 3.5); bigNumber(c, fmt(321 * p), W / 2, 520, 330, C.goldHi, "center"); txt(c, "tonnes of gold bought by central banks", W / 2, 610, { size: 48, align: "center", font: SERIF }); txt(c, "July to September 2026", W / 2, 670, { size: 32, color: C.mute, align: "center" }); txt(c, "and most of it was never announced", W / 2, 800, { size: 44, align: "center", color: C.gold, font: SERIF, italic: true, alpha: clamp((t - 4.5) / 1.2) }); } },
  /* 1 promise */ { draw: (c, t) => { title(c, "Three numbers that don't seem to fit together", ease(t / 1), 300); ["Central banks buying", "Jewellery and savers selling up", "A price that later slipped"].forEach((s, i) => { const p = ease((t - 1.5 - i * 1.6) / 0.8), y = 470 + i * 130; rr(c, 80, y, 1400, 100, 14, C.panel, C.line, 2, p); bigNumber(c, String(i + 1), 130, y + 70, 56, C.gold); txt(c, s, 220, y + 66, { size: 40, alpha: p }); }); } },
  /* 2 table */ { src: SRC.wgc, draw: (c, t) => {
    title(c, "Gold Demand Trends: mostly a table", ease(t / 0.8), 200);
    const rows: [string, string, string][] = [["Jewellery consumption", "312.9", "-17%"], ["Technology", "84.8", "+3%"], ["Bar and coin investment", "267.8", "-19%"], ["Gold ETFs and similar", "211.2", ""], ["Central banks and other institutions", "321.2", "+42%"]];
    txt(c, "TONNES", 1380, 300, { size: 24, color: C.mute, align: "right" }); txt(c, "VS YEAR AGO", 1620, 300, { size: 24, color: C.mute, align: "right" });
    rows.forEach((r, i) => { const p = ease((t - 0.8 - i * 0.9) / 0.6), y = 330 + i * 100, hi = i === 4; const pulse = hi ? 0.6 + 0.4 * Math.sin(t * 3) : 0;
      rr(c, 80, y, 1580, 84, 10, hi ? "rgba(212,166,74," + (0.16 + pulse * 0.12) + ")" : C.panel, hi ? C.gold : C.line, hi ? 3 : 1, p);
      txt(c, r[0], 110, y + 56, { size: 34, alpha: p, weight: hi ? "bold" : "normal", color: hi ? C.goldHi : C.text }); txt(c, r[1], 1380, y + 56, { size: 36, align: "right", alpha: p, weight: "bold" });
      txt(c, r[2], 1620, y + 56, { size: 34, align: "right", alpha: p, color: r[2].startsWith("-") ? C.red : C.green }); });
    txt(c, "Selected rows, Q3 2026", 80, 880, { size: 24, color: C.mute }); } },
  /* 3 321 vs 226 */ { src: SRC.wgc, draw: (c, t) => { title(c, "The row that moved", 1, 200); hbars(c, t, [{ label: "Q3 2025", value: 226.3, shown: "226 t", color: C.mute }, { label: "Q3 2026", value: 321.2, shown: "321 t", color: C.gold }], { x: 80, y: 330, w: 1600, rowH: 150, max: 340, labelW: 260, delay: 1.2 });
    const ax = 80 + 260 + (227 / 340) * (1600 - 260 - 40); c.save(); c.setLineDash([10, 8]); c.strokeStyle = C.mute; c.lineWidth = 2; c.beginPath(); c.moveTo(ax, 310); c.lineTo(ax, 660); c.stroke(); c.restore();
    txt(c, "five-year quarterly average, about 227 t", ax, 700, { size: 26, color: C.mute, align: "center", alpha: clamp((t - 4) / 1) });
    const p = ease((t - 6) / 1); rr(c, 1380, 760, 300, 100, 50, C.gold, undefined, 0, p); txt(c, "+42%", 1530, 832, { size: 62, weight: "bold", color: C.bg, align: "center", alpha: p, font: SERIF }); } },
  /* 4 YTD */ { src: SRC.wgc, draw: (c, t) => { const p = ease(t / 3); bigNumber(c, fmt(675 * p), W / 2, 560, 300, C.goldHi, "center"); txt(c, "tonnes bought so far this year (Jan to Sep)", W / 2, 650, { size: 44, align: "center", font: SERIF }); txt(c, "+6% versus the same stretch of 2025", W / 2, 720, { size: 34, color: C.green, align: "center", alpha: clamp((t - 3.5) / 1) }); } },
  /* 5 stack */ { src: SRC.calc, draw: (c, t) => { title(c, "How big is 321 tonnes?", 1, 220); const p = ease(t / 2), bx = 80, bw = 1760, by = 400, bh = 150; rr(c, bx, by, bw * p, bh, 10, C.panel, C.line);
    const cb = (321.2 / 1368.6) * bw * p; rr(c, bx, by, cb, bh, 10, C.gold); txt(c, "Total gold demand, Q3: 1,369 t", bx, by - 24, { size: 32, color: C.mute, alpha: p }); const q = clamp((t - 2.5) / 1);
    txt(c, "Central banks 321 t", bx + 20, by + 92, { size: 34, color: C.bg, weight: "bold", alpha: q }); txt(c, "all other demand", bx + cb + 40, by + 92, { size: 34, color: C.mute, alpha: q });
    bigNumber(c, "about 23%", W / 2, 800, 140, C.goldHi, "center"); txt(c, "of everything bought in the quarter", W / 2, 870, { size: 38, align: "center", alpha: clamp((t - 5) / 1) }); } },
  /* 6 supply */ { src: SRC.wgc, draw: (c, t) => { title(c, "Supply in the same quarter", 1, 220); hbars(c, t, [{ label: "Mine production", sub: "a third-quarter record", value: 1070.9, shown: "1,071 t (+3%)", color: C.gold }, { label: "Recycled gold", sub: "old jewellery sold back", value: 314.5, shown: "315 t (-8%)", color: C.mute }], { x: 80, y: 360, w: 1700, rowH: 190, max: 1250, labelW: 420, delay: 1.5 }); } },
  /* 7 mix */ { draw: (c, t) => { const a = ease(t / 1); para(c, "The total barely moved.", W / 2, 440, 1500, { size: 84, font: SERIF, align: "center", alpha: a }); para(c, "The mix underneath it moved a lot.", W / 2, 590, 1500, { size: 84, font: SERIF, align: "center", color: C.goldHi, alpha: clamp((t - 2) / 1) }); } },
  /* 8 gap */ { draw: (c, t) => { para(c, "Central banks don't have to say when they buy.", W / 2, 400, 1500, { size: 76, font: SERIF, align: "center", lh: 100, alpha: ease(t / 1) }); txt(c, "Some publish monthly.", W / 2, 640, { size: 44, align: "center", color: C.mute, alpha: clamp((t - 2) / 1) }); txt(c, "Many don't.", W / 2, 710, { size: 44, align: "center", color: C.gold, weight: "bold", alpha: clamp((t - 3.2) / 1) }); } },
  /* 9 reported split */ { src: SRC.kitco, draw: (c, t) => { title(c, "Of the 321 tonnes...", 1, 220); const bx = 80, bw = 1760, by = 400, bh = 170, rep = (120 / 321) * bw; const p = ease(t / 1.6);
    rr(c, bx, by, rep * p, bh, 10, C.gold); const q = clamp((t - 2.5) / 1.2);
    c.save(); c.globalAlpha = q; rr(c, bx + rep, by, (bw - rep) * q, bh, 10, "#232A39", C.mute, 2); c.fillStyle = "rgba(142,147,160,0.22)"; for (let i = 0; bx + rep + 20 + i * 34 < bx + (bw - 20) * 1; i++) c.fillRect(bx + rep + 20 + i * 34, by + 10, 10, bh - 20); c.restore();
    txt(c, "about 120 t officially reported", bx, by + bh + 60, { size: 34, color: C.goldHi, alpha: p }); txt(c, "about 200 t not reported", bx + rep + 20, by + bh + 60, { size: 34, color: C.mute, alpha: q });
    bigNumber(c, "~63%", W / 2, 770, 140, C.goldHi, "center"); txt(c, "unreported, the pattern for four years (Kitco)", W / 2, 825, { size: 30, color: C.mute, align: "center", alpha: clamp((t - 5) / 1) }); } },
  /* 10 disclosed buyers */ { src: SRC.kitco, draw: (c, t) => { title(c, "The biggest disclosed buyers", 1, 220); hbars(c, t, [{ label: "China (central bank)", value: 63, shown: "about 63 t", color: C.gold }, { label: "Poland (central bank)", value: 40, shown: "about 40 t", color: C.gold }], { x: 80, y: 360, w: 1700, rowH: 170, max: 70, labelW: 520, delay: 1.5 }); } },
  /* 11 note 1 */ { draw: (c, t) => { rr(c, 330, 280, 1260, 420, 14, "#F1E9D6", undefined, 0, ease(t / 0.8)); txt(c, "Journal note", 400, 360, { size: 28, color: "#8A6A1F", font: SERIF, italic: true, alpha: ease(t / 0.8) });
    para(c, "The count always arrives late, and it's never complete.", 400, 460, 1120, { size: 58, font: SERIF, color: "#2A2418", lh: 80, alpha: clamp((t - 0.6) / 1.2) }); } },
  /* 12 second number */ { src: SRC.wgc, draw: (c, t) => { title(c, "The second number: who wasn't buying", 1, 200); hbars(c, t, [{ label: "Jewellery", sub: "313 t, weakest Q3 in the data", value: -17, shown: "-17%", color: C.red }, { label: "Bar and coin", sub: "268 t, lowest in four years (Kitco)", value: -19, shown: "-19%", color: C.red }, { label: "All investment", sub: "479 t", value: -14, shown: "-14%", color: C.red }], { x: 80, y: 320, w: 1760, rowH: 190, max: 22, diverge: true, labelW: 640, delay: 1.5 }); } },
  /* 13 quote */ { src: SRC.quote, draw: (c, t) => { const a = ease(t / 1); txt(c, "“", 150, 330, { size: 220, color: C.gold, font: SERIF, alpha: a });
    para(c, "Fiscal concerns and broader uncertainty have partly offset the higher opportunity cost of holding gold.", 260, 400, 1400, { size: 60, font: SERIF, italic: true, lh: 84, alpha: clamp((t - 0.5) / 1.5) }); } },
  /* 14 opportunity cost */ { draw: (c, t) => { title(c, "Opportunity cost", 1, 200); const a = ease((t - 0.6) / 1), b = ease((t - 4) / 1), d = ease((t - 8) / 1);
    rr(c, 80, 320, 820, 380, 18, C.panel, C.gold, 3, a); txt(c, "Hold gold", 130, 410, { size: 44, font: SERIF, color: C.goldHi, alpha: a }); para(c, "Pays no interest. Costs money to store and insure.", 130, 480, 720, { size: 36, alpha: a, color: C.text });
    rr(c, 1020, 320, 820, 380, 18, C.panel, C.line, 2, b); txt(c, "Hold something that pays", 1070, 410, { size: 44, font: SERIF, alpha: b }); para(c, "Cash or bonds can earn income while you wait.", 1070, 480, 720, { size: 36, alpha: b });
    para(c, "What you give up by choosing gold is the opportunity cost.", W / 2, 840, 1500, { size: 46, font: SERIF, italic: true, align: "center", color: C.goldHi, alpha: d }); } },
  /* 15 region bar & coin */ { src: SRC.kitco, draw: (c, t) => { title(c, "Bar and coin demand, versus a year ago", 1, 200); hbars(c, t, [{ label: "China", sub: "about 79 t", value: 7, shown: "+7%", color: C.green }, { label: "India", sub: "about 55 t", value: -40, shown: "-40%", color: C.red }, { label: "United States", sub: "about 8 t", value: -40, shown: "-40%", color: C.red }], { x: 80, y: 320, w: 1760, rowH: 190, max: 45, diverge: true, labelW: 520, delay: 1.5 }); } },
  /* 16 region jewellery */ { src: SRC.kitco, draw: (c, t) => { title(c, "Jewellery demand, versus a year ago", 1, 220); hbars(c, t, [{ label: "China", sub: "66 t", value: -22, shown: "-22%", color: C.red }, { label: "India", sub: "about 100 t", value: -20, shown: "-20%", color: C.red }], { x: 80, y: 360, w: 1760, rowH: 200, max: 28, diverge: true, labelW: 520, delay: 1.5 }); } },
  /* 17 guessing */ { draw: (c, t) => { para(c, "A table tells you what happened.", W / 2, 430, 1500, { size: 76, font: SERIF, align: "center", alpha: ease(t / 1) }); para(c, "Where the data stops, the guessing starts.", W / 2, 580, 1500, { size: 76, font: SERIF, align: "center", color: C.goldHi, italic: true, alpha: clamp((t - 2.5) / 1.2) }); } },
  /* 18 price */ { src: SRC.wgc, draw: (c, t) => { const p = ease(t / 3); bigNumber(c, "$" + fmt(4262 * p), W / 2, 540, 280, C.goldHi, "center"); txt(c, "per ounce, Q3 average (LBMA PM)", W / 2, 630, { size: 44, font: SERIF, align: "center" });
    [["+23% vs a year ago", 3.5], ["third strongest quarterly average on record", 5]].forEach(([s, d], i) => { const q = ease((t - (d as number)) / 0.8), w = i === 0 ? 480 : 820; rr(c, W / 2 - w / 2, 710 + i * 100, w, 76, 38, C.panel, C.gold, 2, q); txt(c, s as string, W / 2, 760 + i * 100, { size: 32, align: "center", alpha: q }); }); } },
  /* 19 slipped */ { src: SRC.kitco, draw: (c, t) => { const a = ease(t / 1.2); txt(c, "Later: below $4,000", W / 2, 470, { size: 120, font: SERIF, align: "center", color: C.red, weight: "bold", alpha: a });
    txt(c, "after a two-month downtrend", W / 2, 560, { size: 40, align: "center", color: C.mute, alpha: a }); para(c, "Gold fell here. It can fall again.", W / 2, 740, 1500, { size: 66, font: SERIF, align: "center", italic: true, color: C.goldHi, alpha: clamp((t - 3) / 1.2) }); } },
  /* 20 funds */ { src: SRC.wgc, draw: (c, t) => { title(c, "The fourth row: gold ETFs", 1, 200); hbars(c, t, [{ label: "Q2 2026", value: -47.3, shown: "-47 t", color: C.red }, { label: "Q3 2026", value: 211.2, shown: "+211 t", color: C.green }], { x: 80, y: 330, w: 1760, rowH: 200, max: 230, diverge: true, labelW: 300, delay: 1.8 });
    const q = ease((t - 6) / 1); rr(c, W / 2 - 520, 750, 1040, 90, 45, C.panel, C.gold, 2, q); txt(c, "Record total holdings: 4,256 t (Kitco)", W / 2, 808, { size: 36, align: "center", alpha: q }); } },
  /* 21 who reports */ { draw: (c, t) => { title(c, "Who tells you, and when", 1, 200); [["Gold ETFs", "daily"], ["Central banks", "when they choose"], ["Jewellery shoppers", "never"]].forEach(([a, b], i) => { const p = ease((t - 0.8 - i * 2.2) / 0.8), y = 330 + i * 160; rr(c, 80, y, 1700, 120, 14, C.panel, C.line, 2, p); txt(c, a, 130, y + 76, { size: 44, alpha: p }); txt(c, b, 1730, y + 76, { size: 44, font: SERIF, italic: true, color: C.goldHi, align: "right", alpha: p }); }); } },
  /* 22 outlook */ { src: SRC.kitco, draw: (c, t) => { title(c, "Expected rise in 2026 investment demand", 1, 200); hbars(c, t, [{ label: "Earlier estimate", value: 400, shown: "about +400 t", color: C.mute }, { label: "Now", value: 200, shown: "about +200 t", color: C.gold }], { x: 80, y: 340, w: 1760, rowH: 190, max: 440, labelW: 420, delay: 2 }); txt(c, "versus 2025", 80, 790, { size: 28, color: C.mute }); } },
  /* 23 promises */ { draw: (c, t) => { title(c, "Whose promise is it?", 1, 200); [["Government bond", "a government's promise", C.mute], ["Bank deposit", "a bank's promise", C.mute], ["A bar in a vault", "nobody's promise", C.goldHi]].forEach(([a, b, col], i) => { const p = ease((t - 1.2 - i * 3) / 0.9), x = 80 + i * 600; rr(c, x, 340, 560, 380, 18, C.panel, i === 2 ? C.gold : C.line, i === 2 ? 3 : 2, p); txt(c, a as string, x + 40, 450, { size: 40, font: SERIF, alpha: p }); txt(c, b as string, x + 40, 530, { size: 34, color: col as string, alpha: p }); }); } },
  /* 24 1971 */ { draw: (c, t) => { const a = ease(t / 1.5); bigNumber(c, "1971", W / 2, 520, 300, C.goldHi, "center"); c.fillStyle = C.line; c.fillRect(260, 600, 1400, 4); c.fillStyle = C.gold; c.fillRect(260, 600, 1400 * a, 4);
    para(c, "The US stops swapping other governments' dollars for gold at a fixed price.", W / 2, 700, 1400, { size: 42, align: "center", font: SERIF, alpha: clamp((t - 2) / 1.2) }); para(c, "Gold becomes one choice among many for reserves.", W / 2, 840, 1400, { size: 36, align: "center", color: C.mute, alpha: clamp((t - 6) / 1.2) }); } },
  /* 25 you vs bank */ { draw: (c, t) => { title(c, "A different job from yours", 1, 200); const a = ease((t - 0.8) / 1), b = ease((t - 6) / 1);
    rr(c, 80, 320, 820, 420, 18, C.panel, C.gold, 3, a); txt(c, "A central bank", 130, 410, { size: 44, font: SERIF, color: C.goldHi, alpha: a }); ["Holds reserves to be trusted", "Wants something that works in a crisis", "No rent to pay, no deadline"].forEach((s, i) => txt(c, s, 130, 490 + i * 70, { size: 32, alpha: a }));
    rr(c, 1020, 320, 820, 420, 18, C.panel, C.line, 2, b); txt(c, "You", 1070, 410, { size: 44, font: SERIF, alpha: b }); ["Your own goals", "Your own timeline", "Your own costs"].forEach((s, i) => txt(c, s, 1070, 490 + i * 70, { size: 32, alpha: b, color: C.mute })); } },
  /* 26 page */ { draw: (c, t) => { rr(c, 380, 150, 1160, 800, 14, "#F1E9D6", undefined, 0, ease(t / 1)); c.fillStyle = "#D8CDB2"; for (let i = 0; i < 9; i++) c.fillRect(430, 330 + i * 70, 1060, 2); txt(c, "What I wrote at the bottom of the page", 430, 240, { size: 40, font: SERIF, italic: true, color: "#2A2418", weight: "bold", alpha: ease(t / 1) }); } },
  /* 27-30 notes */ { draw: (c, t) => notePage(0)(c, t) }, { draw: (c, t) => notePage(1)(c, t) }, { draw: (c, t) => notePage(2)(c, t) }, { draw: (c, t) => notePage(3)(c, t) },
  /* 31 disclaimer */ { draw: (c, t) => { const a = ease(t / 1); txt(c, "Not financial advice", W / 2, 400, { size: 92, font: SERIF, align: "center", alpha: a }); para(c, "Gold can fall as well as rise in price, and holding it carries storage, spread and liquidity costs. Nothing here is a recommendation to buy or sell, and nothing predicts future prices.", W / 2, 520, 1400, { size: 32, align: "center", color: C.mute, alpha: clamp((t - 0.8) / 1) }); } },
  /* 32 end */ { draw: (c, t) => { const a = ease(t / 1.2); txt(c, "THE GOLD JOURNAL", W / 2, 460, { size: 110, font: SERIF, align: "center", color: C.goldHi, weight: "bold", alpha: a }); txt(c, "Open the document first.", W / 2, 560, { size: 46, align: "center", alpha: clamp((t - 1) / 1) }); txt(c, "Follow for the next entry", W / 2, 650, { size: 36, align: "center", color: C.mute, alpha: clamp((t - 2) / 1) });
    para(c, "Sources: World Gold Council, Gold Demand Trends Q3 2026 (3 Nov 2026); Kitco (3 Nov 2026). Narration is AI-generated.", W / 2, 880, 1500, { size: 24, color: C.mute, align: "center", alpha: clamp((t - 3) / 1) }); } },
];

// ---------- timing ----------
const narration = fs.readFileSync(path.resolve("specs/gold-journal/central-banks-q3-2026.narration.txt"), "utf8").trim().split(/\n\s*\n/);
if (narration.length !== BEATS.length) throw new Error(`narration has ${narration.length} paragraphs but ${BEATS.length} visuals; keep them in step`);
const probe = (f: string) => Number(spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).stdout.toString().trim());
const words = (s: string) => s.split(/\s+/).filter(Boolean).length;
let durs = narration.map((p) => Math.max(2.5, (words(p) / WPM) * 60 + 0.35));
const audioFile = arg("audio"), audioDir = arg("audio-dir");
if (audioDir) durs = narration.map((_, i) => probe(path.join(audioDir, `p${String(i).padStart(2, "0")}.mp3`)) + 0.25);
else if (audioFile) { const total = probe(audioFile), sum = durs.reduce((a, b) => a + b, 0); durs = durs.map((d) => (d * total) / sum); }
const starts = durs.map((_, i) => durs.slice(0, i).reduce((a, b) => a + b, 0));
const total = starts[starts.length - 1] + durs[durs.length - 1];

// ---------- captions (phrase cues, proportional to characters inside each paragraph) ----------
type Cue = { start: number; end: number; text: string };
const cues: Cue[] = [];
narration.forEach((p, i) => {
  const sentences = p.replace(/\n/g, " ").match(/[^.!?:]+[.!?:]*\s*/g) ?? [p];
  const chunks: string[] = [];
  for (const s of sentences) { let cur = ""; for (const w of s.trim().split(/\s+/)) { if ((cur + " " + w).trim().length > 84 && cur) { chunks.push(cur); cur = w; } else cur = (cur + " " + w).trim(); } if (cur) chunks.push(cur); }
  const chars = chunks.reduce((a, b) => a + b.length, 0); let t = starts[i];
  const span = durs[i] - 0.3;
  for (const ch of chunks) { const d = (ch.length / chars) * span; cues.push({ start: t, end: t + d - 0.04, text: ch }); t += d; }
});
const ts = (s: number, sep: string) => { const ms = Math.round(s * 1000), h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), sec = Math.floor((ms % 60000) / 1000); return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}${sep}${String(ms % 1000).padStart(3, "0")}`; };
const srt = cues.map((q, i) => `${i + 1}\n${ts(q.start, ",")} --> ${ts(q.end, ",")}\n${q.text}\n`).join("\n");
const vtt = "WEBVTT\n\n" + cues.map((q) => `${ts(q.start, ".")} --> ${ts(q.end, ".")}\n${q.text}\n`).join("\n");
const cs = (s: number) => { const t = Math.round(s * 100); return `${Math.floor(t / 360000)}:${String(Math.floor((t % 360000) / 6000)).padStart(2, "0")}:${String(Math.floor((t % 6000) / 100)).padStart(2, "0")}.${String(t % 100).padStart(2, "0")}`; };
const breakMid = (s: string) => { if (s.length <= 44) return s; const mid = s.length / 2; let best = -1; for (let i = 0; i < s.length; i++) if (s[i] === " " && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i; return s.slice(0, best) + "\\N" + s.slice(best + 1); };
const ass = `[Script Info]\nScriptType: v4.00+\nPlayResX: ${W}\nPlayResY: ${H}\nWrapStyle: 2\n\n[V4+ Styles]\nFormat: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding\nStyle: Cap,DejaVu Sans,44,&H00E6EFF3&,&H00E6EFF3&,&H99120D0B&,&H99120D0B&,0,0,0,0,100,100,0,0,3,14,0,2,160,160,110,1\n\n[Events]\nFormat: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text\n` +
  cues.map((q) => `Dialogue: 0,${cs(q.start)},${cs(q.end)},Cap,,0,0,0,,${breakMid(q.text).replace(/[{}]/g, "")}`).join("\n") + "\n";
fs.writeFileSync(path.join(OUT, `gold-journal-${SLUG}.srt`), srt);
fs.writeFileSync(path.join(OUT, `gold-journal-${SLUG}.vtt`), vtt);
fs.writeFileSync(path.join(OUT, "captions.ass"), ass);
fs.writeFileSync(path.join(OUT, "timing.json"), JSON.stringify({ mode: audioDir ? "audio-dir" : audioFile ? "audio-scaled" : `estimated-${WPM}wpm`, totalSeconds: total, paragraphs: durs.map((d, i) => ({ i, start: +starts[i].toFixed(2), dur: +d.toFixed(2), text: narration[i].slice(0, 50) })) }, null, 1));

// ---------- render ----------
async function main() {
  const seconds = MAX_S ? Math.min(MAX_S, total) : total, frames = Math.round(seconds * FPS);
  const w = 960, h = 540, silent = path.join(OUT, "silent.mp4");
  const canvas = createCanvas(w, h), ctx = canvas.getContext("2d") as unknown as Ctx;
  const ff = spawn("ffmpeg", ["-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${w}x${h}`, "-r", String(FPS), "-i", "-", "-vf", `scale=${W}:${H}:flags=lanczos`, "-c:v", "libx264", "-preset", "veryfast", "-crf", "19", "-pix_fmt", "yuv420p", "-r", String(FPS), silent]);
  let err = ""; ff.stderr.on("data", (d) => (err += d));
  const done = new Promise<void>((res, rej) => { ff.on("close", (code) => (code === 0 ? res() : rej(new Error("ffmpeg encode failed: " + err.slice(-500))))); ff.on("error", rej); });
  let idx = 0;
  for (let f = 0; f < frames; f++) {
    const T = f / FPS; while (idx < BEATS.length - 1 && T >= starts[idx + 1]) idx++;
    const t = T - starts[idx], d = durs[idx];
    ctx.setTransform(w / W, 0, 0, h / H, 0, 0);
    background(ctx, T); chrome(ctx, BEATS[idx].src);
    BEATS[idx].draw(ctx, t, d);
    const fade = Math.max(1 - clamp(t / 0.35), clamp((t - (d - 0.35)) / 0.35)); // dip to dark between sections
    if (fade > 0) { ctx.fillStyle = `rgba(11,13,18,${fade * 0.9})`; ctx.fillRect(0, 0, W, H); }
    if (!ff.stdin.write(canvas.data())) await new Promise((r) => ff.stdin.once("drain", r));
    if (f % (FPS * 30) === 0) console.log(`frame ${f}/${frames} (${((f / frames) * 100).toFixed(0)}%)`);
  }
  ff.stdin.end(); await done;

  const final = path.join(OUT, `gold-journal-${SLUG}.mp4`);
  const args = ["-y", "-i", silent];
  if (audioFile) args.push("-i", audioFile);
  const vf = flag("no-burn") ? [] : ["-vf", `ass=${path.join(OUT, "captions.ass").replace(/:/g, "\\:")}`];
  args.push(...vf, "-c:v", "libx264", "-preset", "veryfast", "-crf", "19", "-pix_fmt", "yuv420p");
  if (audioFile) args.push("-c:a", "aac", "-b:a", "192k", "-shortest"); else args.push("-an");
  args.push("-movflags", "+faststart", final);
  const r = spawnSync("ffmpeg", args, { encoding: "utf8" });
  if (r.status !== 0) throw new Error("ffmpeg mux failed: " + r.stderr.slice(-500));
  fs.rmSync(silent, { force: true });
  console.log("done:", final, `${(seconds / 60).toFixed(1)} min`);
}
main().catch((e) => { console.error(e); process.exit(1); });
