import React from "react";
import { useCurrentFrame } from "remotion";
import { BANGERS, COMIC } from "../fonts";
import { rand } from "../Frame";
import { LINO } from "../theme";

/**
 * Huge carved headline. Letters stamp on one at a time (on twos), each a little off-true like hand-cut type.
 * `ghost` prints a red registration copy behind the black.
 */
export const CarvedHeadline: React.FC<{
  lines: string[];
  x: number;
  y: number;
  w: number;
  fs: number;
  start: number;
  color?: string;
  ghost?: [number, number] | null;
  align?: "left" | "center";
  perLetter?: number;
  lineHeight?: number;
}> = ({ lines, x, y, w, fs, start, color = LINO.ink, ghost = null, align = "left", perLetter = 1, lineHeight = 0.98 }) => {
  const frame = useCurrentFrame();
  const t = Math.floor((frame - start) / 2) * 2;
  if (t < 0) return null;
  let idx = 0;
  const render = (c: string, off: [number, number], key: string) => (
    <div key={key} style={{ position: "absolute", left: x + off[0], top: y + off[1], width: w, textAlign: align, filter: "url(#lino-ink)", zIndex: 50 }}>
      {lines.map((ln, li) => (
        <div key={li} style={{ fontFamily: BANGERS, fontSize: fs, lineHeight, letterSpacing: fs * 0.02, color: c, whiteSpace: "nowrap" }}>
          {ln.split("").map((ch, ci) => {
            const k = idx++;
            const shown = t >= k * perLetter;
            const age = t - k * perLetter;
            const s = shown && age < 2 ? 1.18 : 1;
            return (
              <span
                key={ci}
                style={{
                  display: "inline-block",
                  opacity: shown ? 1 : 0,
                  transform: `translateY(${(rand(k + 3) - 0.5) * fs * 0.05}px) rotate(${(rand(k + 9) - 0.5) * 4}deg) scale(${s})`,
                }}
              >
                {ch === " " ? " " : ch}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
  const out = [];
  if (ghost) {
    idx = 0;
    out.push(render(LINO.red, ghost, "g"));
  }
  idx = 0;
  out.push(render(color, [0, 0], "k"));
  return <>{out}</>;
};

/** Speaker tag: a red block with the name cut out of it. */
export const NameBlock: React.FC<{ name: string; x: number; y: number; fs?: number; start: number; rot?: number }> = ({ name, x, y, fs = 48, start, rot = -3 }) => {
  const frame = useCurrentFrame();
  if (frame < start) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `rotate(${rot}deg)`, background: LINO.red, padding: `${fs * 0.12}px ${fs * 0.35}px ${fs * 0.02}px`, filter: "url(#lino-ink)", zIndex: 60 }}>
      <div style={{ fontFamily: BANGERS, fontSize: fs, letterSpacing: 3, color: LINO.paper, lineHeight: 1.05 }}>{name}</div>
    </div>
  );
};

/** SOURCE tag in print: a black bar with the label in red. Readable at phone size (>= 28 px on a 1080-wide Short). */
export const LinoSourceTag: React.FC<{ text: string; x: number; y: number; w: number; fs?: number; start?: number }> = ({ text, x, y, w, fs = 32, start = 4 }) => {
  const frame = useCurrentFrame();
  if (frame < start) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, maxWidth: w, background: LINO.ink, padding: "8px 18px 10px", filter: "url(#lino-ink)", zIndex: 60 }}>
      <span style={{ fontFamily: BANGERS, fontSize: fs * 1.05, letterSpacing: 2, color: LINO.red, marginRight: 12 }}>SOURCE</span>
      <span style={{ fontFamily: COMIC, fontWeight: 700, fontSize: fs, color: LINO.paper, lineHeight: 1.2 }}>{text}</span>
    </div>
  );
};
