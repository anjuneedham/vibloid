import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { BANGERS, COMIC } from "../fonts";
import type { Span } from "../moment";
import { LINO } from "../theme";

// WORDS BUILT INTO THE PRINT (linocut).
// - Banderole: the speech object. A printed paper scroll (the medieval speech scroll) with rolled ends and a red name tab,
//   tied to the speaking figure by a carved red ribbon that runs from the figure's hand down into the scroll.
// - StampedSource: the source tag printed on the sheet like a rubber-stamp impression (double red rule).

export type LinoPage = { text: string; from: number; to: number };

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const Banderole: React.FC<{
  name: string;
  pages: LinoPage[];
  span: Span;
  /** the scroll's box (top-left and width) */
  left: number;
  top: number;
  w: number;
  /** the speaker's hand: where the ribbon starts */
  from: [number, number];
  /** last frame the scroll may show (the next line's start), so scrolls never overlap */
  until?: number;
  /** pages whose words are already printed on the art: keep the lead-in up instead */
  suppress?: number[];
}> = ({ name, pages, span, left, top, w, from, until = 1e9, suppress = [] }) => {
  const frame = useCurrentFrame();
  const [a, b] = span;
  const end = Math.min(b + 12, until - 3);
  if (frame < a - 3 || frame >= Math.max(b + 2, end)) return null;
  const dur = b - a;
  let pi = pages.findIndex((p) => frame < a + dur * p.to);
  if (pi < 0) pi = pages.length - 1;
  while (pi > 0 && suppress.includes(pi)) pi--;
  const page = pages[pi];
  const p0 = a + dur * page.from;
  const words = page.text.split(" ");
  const per = Math.max(1, Math.min(3, (a + dur * page.to - p0) / (words.length * 2.4)));
  // unrolls on twos (print rhythm)
  const t = Math.floor((frame - (a - 3)) / 2) * 2;
  const unroll = interpolate(t, [0, 6], [0.15, 1], clamp);
  // the ribbon: from the hand, curving down into the scroll's top edge
  const tx = Math.max(left + 90, Math.min(left + w - 90, from[0]));
  const ribbon = `M${from[0] - 5} ${from[1]} C ${from[0] - 22} ${(from[1] + top) / 2}, ${tx - 26} ${top - 40}, ${tx - 13} ${top + 6} L ${tx + 13} ${top + 6} C ${tx + 4} ${top - 40}, ${from[0] + 26} ${(from[1] + top) / 2}, ${from[0] + 5} ${from[1]} Z`;
  return (
    <>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, zIndex: 64, overflow: "visible", opacity: unroll > 0.3 ? 1 : 0 }}>
        <g filter="url(#lino-ink)">
          <path d={ribbon} fill={LINO.red} stroke={LINO.ink} strokeWidth={3} />
        </g>
      </svg>
      <div style={{ position: "absolute", left: left + (w * (1 - unroll)) / 2, top, width: w * unroll, zIndex: 70, overflow: "visible" }}>
        <div style={{ position: "relative", background: LINO.paper, borderTop: `8px solid ${LINO.ink}`, borderBottom: `8px solid ${LINO.ink}`, padding: "40px 54px 22px", filter: "url(#lino-ink)", minHeight: 120, overflow: "hidden" }}>
          <div style={{ fontFamily: COMIC, fontWeight: 700, fontSize: 50, lineHeight: 1.14, color: LINO.ink, opacity: unroll > 0.9 ? 1 : 0 }}>
            {words.map((wd, i) => (
              <React.Fragment key={i}>
                <span style={{ whiteSpace: "nowrap", opacity: frame >= Math.floor((p0 + i * per) / 2) * 2 ? 1 : 0.15 }}>{wd}</span>
                {i < words.length - 1 ? " " : ""}
              </React.Fragment>
            ))}
          </div>
        </div>
        {/* rolled ends of the scroll */}
        {[-1, 1].map((s) => (
          <div
            key={s}
            style={{
              position: "absolute",
              top: -6,
              bottom: -6,
              [s < 0 ? "left" : "right"]: -14,
              width: 30,
              borderRadius: 15,
              background: `repeating-linear-gradient(0deg, ${LINO.ink} 0 6px, ${LINO.paper} 6px 12px)`,
              border: `5px solid ${LINO.ink}`,
              filter: "url(#lino-ink)",
            }}
          />
        ))}
        <div style={{ position: "absolute", left: 40, top: -30, background: LINO.red, padding: "6px 16px 0", filter: "url(#lino-ink)" }}>
          <div style={{ fontFamily: BANGERS, fontSize: 46, letterSpacing: 3, color: LINO.paper, lineHeight: 1.05 }}>{name}</div>
        </div>
      </div>
    </>
  );
};

/** The source, printed like a rubber-stamp impression on the sheet: double red rule, ink words, a small tilt. >= 30 px. */
export const StampedSource: React.FC<{ text: string; x: number; y: number; w: number; rot?: number }> = ({ text, x, y, w, rot = -1.5 }) => (
  <div style={{ position: "absolute", left: x, top: y, maxWidth: w, zIndex: 60, transform: `rotate(${rot}deg)` }}>
    <div style={{ position: "absolute", inset: 0, border: `5px solid ${LINO.red}`, boxShadow: `inset 0 0 0 4px ${LINO.paper}, inset 0 0 0 7px ${LINO.red}`, filter: "url(#lino-stamp)" }} />
    <div style={{ position: "relative", padding: "12px 22px 12px", background: "transparent" }}>
      <span style={{ fontFamily: BANGERS, fontSize: 34, letterSpacing: 2, color: LINO.red, marginRight: 12 }}>SOURCE</span>
      <span style={{ fontFamily: COMIC, fontWeight: 700, fontSize: 30, color: LINO.ink, lineHeight: 1.2 }}>{text}</span>
    </div>
  </div>
);
