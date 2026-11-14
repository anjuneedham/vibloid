import type { Word } from "./providers/transcript";

const cs = (t: number) => {
  const total = Math.round(t * 100);
  const h = Math.floor(total / 360000), m = Math.floor((total % 360000) / 6000), s = Math.floor((total % 6000) / 100), c = total % 100;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(c).padStart(2, "0")}`;
};
const esc = (w: string) => w.replace(/[{}\\]/g, "");

export type CaptionOpts = { width: number; height: number; highlight?: string; font?: string };

/** Group into chunks of <=3 words / <=20 chars. */
export function chunkWords(words: Word[]): Word[][] {
  const chunks: Word[][] = []; let cur: Word[] = [];
  for (const w of words) {
    const len = cur.reduce((a, x) => a + x.w.length + 1, 0) + w.w.length;
    if (cur.length >= 3 || len > 20) { chunks.push(cur); cur = []; }
    cur.push(w);
    if (/[.!?]$/.test(w.w)) { chunks.push(cur); cur = []; }
  }
  if (cur.length) chunks.push(cur);
  return chunks.filter((c) => c.length);
}

/**
 * Word-by-word karaoke captions as ASS. One event per word: the chunk is shown with the active word highlighted.
 * Short (portrait) captions sit above the bottom UI zone; long-form sit near the bottom.
 */
export function buildAss(words: Word[], o: CaptionOpts): string {
  const portrait = o.height > o.width;
  const font = o.font ?? "Inter";
  const size = portrait ? Math.round(o.width / 11) : Math.round(o.height / 14);
  const marginV = portrait ? Math.round(o.height * 0.22) : Math.round(o.height * 0.08);
  const hl = o.highlight ?? "&H0000D7FF&"; // gold (BGR)
  const head = `[Script Info]\nScriptType: v4.00+\nPlayResX: ${o.width}\nPlayResY: ${o.height}\nWrapStyle: 2\n\n` +
    `[V4+ Styles]\nFormat: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding\n` +
    `Style: Cap,${font},${size},&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,${Math.max(4, Math.round(size / 14))},2,2,${Math.round(o.width * 0.06)},${Math.round(o.width * 0.06)},${marginV},1\n\n` +
    `[Events]\nFormat: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text\n`;
  const lines: string[] = [];
  for (const chunk of chunkWords(words)) {
    chunk.forEach((w, i) => {
      const start = w.start;
      const end = chunk[i + 1]?.start ?? w.end;
      const text = chunk.map((x, j) => (j === i ? `{\\c${hl}}${esc(x.w.toUpperCase())}{\\c&H00FFFFFF&}` : esc(x.w.toUpperCase()))).join(" ");
      lines.push(`Dialogue: 0,${cs(start)},${cs(Math.max(end, start + 0.05))},Cap,,0,0,0,,${text}`);
    });
  }
  return head + lines.join("\n") + "\n";
}

/** Parse event start times back out (used by tests to verify sync). */
export function parseAssStarts(ass: string): number[] {
  return [...ass.matchAll(/^Dialogue: \d+,(\d+):(\d\d):(\d\d)\.(\d\d),/gm)].map((m) => +m[1] * 3600 + +m[2] * 60 + +m[3] + +m[4] / 100);
}
