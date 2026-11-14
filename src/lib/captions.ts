import type { Word } from "./providers/transcript";

const cs = (t: number) => {
  const total = Math.round(t * 100);
  const h = Math.floor(total / 360000), m = Math.floor((total % 360000) / 6000), s = Math.floor((total % 6000) / 100), c = total % 100;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(c).padStart(2, "0")}`;
};
/** "#RRGGBB" -> ASS "&H00BBGGRR&" */
export const hexToAss = (hex: string) => `&H00${hex.slice(5, 7)}${hex.slice(3, 5)}${hex.slice(1, 3)}&`.toUpperCase();
const esc = (w: string) => w.replace(/[{}\\]/g, "");

export type CaptionOpts = { width: number; height: number; highlight?: string; font?: string; overlays?: { text: string; start: number; end: number }[]; preset?: "andrew" | "bold" };

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
  // "andrew" preset = the TradeNotes content spec: 58px (at 1080 wide) Inter Medium, dark box at 62% opacity, amber key word,
  // bottom of the box at 70% of the frame height so TikTok/Shorts UI never covers it, sentence case.
  const andrew = o.preset === "andrew";
  const size = andrew ? Math.round((58 * o.width) / 1080) : portrait ? Math.round(o.width / 11) : Math.round(o.height / 14);
  const pad = Math.round((16 * o.width) / 1080);
  const safe = o.preset === "bold"; // the classic big-caption look, but with the box bottom at 70% of the frame (clear of TikTok/Shorts UI)
  const marginV = andrew ? Math.round(o.height * 0.3) + pad : safe ? Math.round(o.height * 0.3) : portrait ? Math.round(o.height * 0.22) : Math.round(o.height * 0.08);
  const hl = andrew ? "&H001EB0F2&" : o.highlight ?? "&H0000D7FF&"; // andrew: amber #F2B01E; default: gold (BGR)
  const base = andrew ? "&H00FAF7F5&" : "&H00FFFFFF&"; // andrew: #F5F7FA
  const cased = (s: string) => (andrew ? s : s.toUpperCase());
  const capStyle = andrew
    ? `Style: Cap,${o.font ?? "Inter Medium"},${size},${base},${base},&H611A0F0A,&H611A0F0A,0,0,0,0,100,100,0,0,3,${pad},0,2,${Math.round(o.width * 0.06)},${Math.round(o.width * 0.06)},${marginV},1\n\n`
    : `Style: Cap,${font},${size},&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,${Math.max(4, Math.round(size / 14))},2,2,${Math.round(o.width * 0.06)},${Math.round(o.width * 0.06)},${marginV},1\n\n`;
  const head = `[Script Info]\nScriptType: v4.00+\nPlayResX: ${o.width}\nPlayResY: ${o.height}\nWrapStyle: 2\n\n` +
    `[V4+ Styles]\nFormat: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding\n` +
    `Style: Top,${font},${Math.round(size * 0.8)},&H0000D7FF,&H00FFFFFF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,${Math.max(4, Math.round(size / 14))},2,8,${Math.round(o.width * 0.06)},${Math.round(o.width * 0.06)},${Math.round(o.height * 0.1)},1\n` +
    capStyle +
    `[Events]\nFormat: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text\n`;
  const lines: string[] = [];
  for (const chunk of chunkWords(words)) {
    chunk.forEach((w, i) => {
      const start = w.start;
      const end = chunk[i + 1]?.start ?? w.end;
      const text = chunk.map((x, j) => (j === i ? `{\\c${hl}}${esc(cased(x.w))}{\\c${base}}` : esc(cased(x.w)))).join(" ");
      lines.push(`Dialogue: 0,${cs(start)},${cs(Math.max(end, start + 0.05))},Cap,,0,0,0,,${text}`);
    });
  }
  for (const ov of o.overlays ?? []) lines.push(`Dialogue: 1,${cs(ov.start)},${cs(ov.end)},Top,,0,0,0,,${esc(ov.text.toUpperCase())}`);
  return head + lines.join("\n") + "\n";
}

/** Parse event start times back out (used by tests to verify sync). */
export function parseAssStarts(ass: string): number[] {
  return [...ass.matchAll(/^Dialogue: \d+,(\d+):(\d\d):(\d\d)\.(\d\d),/gm)].map((m) => +m[1] * 3600 + +m[2] * 60 + +m[3] + +m[4] / 100);
}

const pad2 = (n: number, w = 2) => String(n).padStart(w, "0");
const stamp = (t: number, sep: "," | ".") => {
  const ms = Math.round(t * 1000), h = Math.floor(ms / 3_600_000), m = Math.floor((ms % 3_600_000) / 60_000), s = Math.floor((ms % 60_000) / 1000);
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}${sep}${pad2(ms % 1000, 3)}`;
};
/** Phrase-level cues (one per chunk) for SRT/VTT export. Upload to YouTube (Subtitles); TikTok uses the burned-in captions. */
export function buildCues(words: Word[]) {
  return chunkWords(words).map((c) => ({ start: c[0].start, end: Math.max(c[c.length - 1].end, c[0].start + 0.3), text: c.map((w) => w.w).join(" ") }))
    .map((c, i, a) => ({ ...c, end: Math.min(c.end, a[i + 1] ? a[i + 1].start : c.end) }));
}
export const buildSrt = (words: Word[]) => buildCues(words).map((c, i) => `${i + 1}\n${stamp(c.start, ",")} --> ${stamp(c.end, ",")}\n${c.text}\n`).join("\n");
export const buildVtt = (words: Word[]) => "WEBVTT\n\n" + buildCues(words).map((c) => `${stamp(c.start, ".")} --> ${stamp(c.end, ".")}\n${c.text}\n`).join("\n");
