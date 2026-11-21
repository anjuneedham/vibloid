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

/**
 * Simple story-channel templates (inspired by illustrated explainer channels):
 *  A "name"   – big subject name across the top, subject image fills the frame.
 *  B "number" – big red stat top-left (e.g. "-$6.3 BILLION") with a down-arrow, subject below.
 *  C "board"  – evidence-board look: subject image framed with red pins/string and a label strip at the top.
 * All text sits in the top third: TV and mobile overlay the duration, progress bar and title on the bottom.
 * Text is white with a thick black outline (no dark box), 1-3 words. Optional `characterPath` (PNG with alpha)
 * is placed bottom-left as the channel's recurring "reactor" character.
 */
export type ThumbTemplate = "A" | "B" | "C";
export async function renderTemplateThumbnail(o: { template: ThumbTemplate; bgPath: string; outPath: string; text: string; characterPath?: string; accent?: string }) {
  const words = o.text.trim().split(/\s+/);
  if (words.length > 3) throw new Error("template thumbnail text must be 3 words or fewer");
  const text = o.text.toUpperCase().replace(/'/g, "’").replace(/:/g, "\\:");
  const accent = o.accent ?? "0xE53935";
  const base = `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},eq=saturation=1.35:contrast=1.1,vignette=PI/5`;
  const fs1 = Math.min(150, Math.floor(1180 / (0.62 * text.length)));
  const outline = `fontcolor=white:borderw=10:bordercolor=black:shadowx=6:shadowy=6:shadowcolor=black@0.6`;
  let vf: string;
  if (o.template === "A") {
    vf = `${base},drawtext=fontfile='${FONT}':text='${text}':fontsize=${fs1}:${outline}:x=(w-text_w)/2:y=30`;
  } else if (o.template === "B") {
    const fs2 = Math.min(140, Math.floor(1000 / (0.62 * text.length)));
    vf = `${base},drawtext=fontfile='${FONT}':text='${text}':fontsize=${fs2}:fontcolor=${accent}:borderw=10:bordercolor=white:x=40:y=30`;
  } else {
    vf = `${base},drawbox=x=0:y=0:w=iw:h=ih:color=0x6D4C2F:t=24,` +
      `drawbox=x=150:y=230:w=18:h=18:color=${accent}:t=fill,drawbox=x=1110:y=250:w=18:h=18:color=${accent}:t=fill,` +
      `drawbox=x=159:y=238:w=960:h=4:color=${accent}:t=fill,` +
      `drawbox=x=0:y=0:w=iw:h=170:color=black@0.85:t=fill,` +
      `drawtext=fontfile='${FONT}':text='${text}':fontsize=${Math.min(110, fs1)}:fontcolor=${accent}:borderw=4:bordercolor=white:x=(w-text_w)/2:y=30`;
  }
  const args = ["-y", "-i", o.bgPath];
  if (o.characterPath) {
    args.push("-i", o.characterPath, "-filter_complex", `[0:v]${vf}[b];[1:v]scale=-1:420[c];[b][c]overlay=30:H-h-10`);
  } else args.push("-vf", vf);
  await run("ffmpeg", [...args, "-frames:v", "1", "-update", "1", o.outPath]);
  return { template: o.template, text };
}
