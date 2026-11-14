import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { run } from "./media";

export type ThumbLayout = "left" | "center" | "bottom";

const lum = ([r, g, b]: number[]) => {
  const f = (c: number) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
/** WCAG contrast ratio between two sRGB colors. */
export function contrastRatio(a: number[], b: number[]) {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const W = 1280, H = 720;
const REGION: Record<ThumbLayout, { x: number; y: number; w: number; h: number }> = {
  left: { x: 40, y: 130, w: 960, h: 460 }, center: { x: 140, y: 220, w: 1000, h: 280 }, bottom: { x: 60, y: 470, w: 1160, h: 200 },
};

async function meanColor(img: string, r: { x: number; y: number; w: number; h: number }): Promise<number[]> {
  const out = path.join(os.tmpdir(), `px-${process.pid}-${Date.now()}.rgb`);
  await run("ffmpeg", ["-y", "-i", img, "-vf", `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},crop=${r.w}:${r.h}:${r.x}:${r.y},scale=1:1:flags=area,format=rgb24`, "-f", "rawvideo", "-frames:v", "1", out]);
  const b = fs.readFileSync(out); fs.rmSync(out, { force: true });
  return [b[0], b[1], b[2]];
}

function wrap(text: string): string {
  const w = text.toUpperCase().split(/\s+/);
  if (w.length <= 2) return w.join("\n");
  const mid = Math.ceil(w.length / 2);
  return w.slice(0, mid).join(" ") + "\n" + w.slice(mid).join(" ");
}

const FONT = [process.env.THUMB_FONT, "/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"].find((f) => f && fs.existsSync(f))!;

/** Renders a 1280x720 thumbnail: big text (<=4 words) on a dark box over the image, guaranteed WCAG AA contrast. */
export async function renderThumbnail(o: { bgPath: string; outPath: string; text: string; layout: ThumbLayout }) {
  if (o.text.trim().split(/\s+/).length > 4) throw new Error("thumbnail text must be 4 words or fewer");
  const reg = REGION[o.layout];
  const bg = await meanColor(o.bgPath, reg);
  // Pick the strongest box opacity that still shows the picture; raise until contrast >= 4.5 (AA) for white text.
  let alpha = 0.6, contrast = 0;
  for (; alpha <= 0.95; alpha += 0.05) {
    const eff = bg.map((c) => c * (1 - alpha));
    contrast = contrastRatio([255, 255, 255], eff);
    if (contrast >= 4.5) break;
  }
  const text = wrap(o.text);
  const lines = text.split("\n");
  const longest = Math.max(...lines.map((l) => l.length));
  const fontsize = Math.min(190, Math.floor((reg.w - 80) / (0.68 * longest)), Math.floor((reg.h - 60) / (1.25 * lines.length)));
  const tf = path.join(os.tmpdir(), `thumb-${process.pid}-${Date.now()}.txt`);
  fs.writeFileSync(tf, text);
  const x = o.layout === "left" ? "70" : "(w-text_w)/2";
  const y = o.layout === "left" ? "(h-text_h)/2" : o.layout === "center" ? "(h-text_h)/2" : "h-text_h-80";
  const vf = `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},eq=saturation=1.15,` +
    `drawtext=fontfile='${FONT}':textfile='${tf}':fontsize=${fontsize}:fontcolor=white:line_spacing=8:x=${x}:y=${y}:box=1:boxcolor=black@${alpha.toFixed(2)}:boxborderw=28:borderw=0`;
  try {
    await run("ffmpeg", ["-y", "-i", o.bgPath, "-vf", vf, "-frames:v", "1", "-update", "1", o.outPath]);
  } finally { fs.rmSync(tf, { force: true }); }
  return { text: lines.join(" "), contrast: +contrast.toFixed(2), alpha: +alpha.toFixed(2), fontsize };
}
