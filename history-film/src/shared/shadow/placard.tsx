import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Who } from "../comic";
import { BANGERS, COMIC } from "../fonts";
import type { Span } from "../moment";
import { SHADOW } from "../theme";

// WORDS BUILT INTO THE SET (shadow theatre).
// - Placard: the speech object. A cream paper card with the speaker's name on a coloured tab, set in dark ink.
//   mount "rod": it stands on its own stage rod beside the speaking puppet (rises on a spring, drops away when done).
//   mount "hang": the same card hung on two cords from the top of the stage, for a voice that is not on stage.
// - SourceRibbon: the source tag as a ribbon pinned to the exhibit (or object) it supports.
// - PaperLabel: a small paper label (date, place, number) pinned to the thing it describes.

export const SPEAKER: Record<Who, { name: string; accent: string }> = {
  curator: { name: "THE CURATOR", accent: SHADOW.brassDark },
  dig: { name: "DIG", accent: SHADOW.screenAmber },
  doubt: { name: "DOUBT", accent: SHADOW.thread },
  clerk: { name: "THE CLERK", accent: SHADOW.gelTeal },
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export type Page = { text: string; from: number; to: number };

/** Which page of a line is showing at `frame`. Suppressed pages (their words are on the exhibit) show the lead-in before them. */
export const pageAt = (pages: Page[], span: Span, frame: number, suppress: number[] = []) => {
  const dur = span[1] - span[0];
  let i = pages.findIndex((p) => frame < span[0] + dur * p.to);
  if (i < 0) i = pages.length - 1;
  while (i > 0 && suppress.includes(i)) i--;
  return { i, page: pages[i], p0: span[0] + dur * pages[i].from, p1: span[0] + dur * pages[i].to };
};

export type PlacardGeom =
  | { mount: "rod"; left: number; bottom: number; w: number; rodX?: number }
  | { mount: "hang"; left: number; top: number; w: number };

/**
 * The speech placard for ONE line. `span` in local frames. Visible from span[0] - 4 to span[1] + 12 (line end + 0.4 s).
 * Text is set at `fs` px (default 50), at most one page (<= 10 words) at a time.
 */
export const Placard: React.FC<{ who: Who; pages: Page[]; span: Span; geom: PlacardGeom; suppress?: number[]; fs?: number; rot?: number; z?: number }> = ({
  who,
  pages,
  span,
  geom,
  suppress = [],
  fs = 50,
  rot = 0,
  z = 30,
}) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const enter = span[0] - 4;
  const exit = span[1] + 12;
  if (frame < enter || frame > exit + 9) return null;
  const k = spring({ frame: frame - enter, fps, config: { damping: 14, stiffness: 170, mass: 0.7 } });
  const out = interpolate(frame, [exit, exit + 9], [0, 1], { ...clamp, easing: (x) => x * x });
  const { i, page, p0, p1 } = pageAt(pages, span, frame, suppress);
  const words = page.text.split(" ");
  const per = Math.max(1, Math.min(3, (p1 - p0) / (words.length * 2.4)));
  const swap = interpolate(frame, [p0 - 1, p0 + 4], [0.4, 1], clamp);
  const sp = SPEAKER[who];
  const rodMount = geom.mount === "rod";
  const dy = rodMount ? (1 - k) * 160 + out * 220 : -(1 - k) * 160 - out * 200;
  const card = (
    <div
      style={{
        position: "relative",
        width: geom.w,
        background: SHADOW.parchment,
        boxShadow: `inset 0 0 0 3px ${SHADOW.scribe}, inset 0 0 26px ${SHADOW.vellumDark}, 10px 14px 26px ${SHADOW.shade}`,
        borderRadius: 6,
        padding: "34px 28px 20px",
        transform: `rotate(${rot}deg)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 18,
          top: -22,
          background: sp.accent,
          padding: "5px 16px 1px",
          fontFamily: BANGERS,
          fontSize: 32,
          letterSpacing: 3,
          color: SHADOW.parchment,
          lineHeight: 1.1,
          boxShadow: `0 3px 0 ${SHADOW.cut}`,
        }}
      >
        {sp.name}
      </div>
      <div key={i} style={{ fontFamily: COMIC, fontWeight: 700, fontSize: fs, lineHeight: 1.16, color: SHADOW.cut, opacity: swap }}>
        {words.map((w, j) => (
          <React.Fragment key={j}>
            <span style={{ whiteSpace: "nowrap", opacity: interpolate(frame, [p0 + j * per, p0 + j * per + 5], [0.25, 1], clamp) }}>{w}</span>
            {j < words.length - 1 ? " " : ""}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
  if (rodMount) {
    const rodX = geom.rodX ?? geom.w / 2;
    return (
      <div style={{ position: "absolute", left: geom.left, bottom: height - geom.bottom, width: geom.w, zIndex: z, transform: `translateY(${dy}px)`, opacity: 1 - out }}>
        {/* the stage rod, coming up from below the stage */}
        <div style={{ position: "absolute", left: rodX - 4, top: "100%", width: 8, height: 900, background: `linear-gradient(90deg, ${SHADOW.cutMid}, ${SHADOW.cut})` }} />
        <div style={{ position: "absolute", left: rodX - 9, top: "100%", width: 18, height: 16, marginTop: -4, background: SHADOW.brass, borderRadius: 3 }} />
        {card}
      </div>
    );
  }
  return (
    <div style={{ position: "absolute", left: geom.left, top: geom.top, width: geom.w, zIndex: z, transform: `translateY(${dy}px)`, opacity: 1 - out }}>
      {/* two cords up to the top of the stage */}
      {[34, geom.w - 34].map((cx) => (
        <div key={cx} style={{ position: "absolute", left: cx - 2, bottom: "100%", width: 4, height: 1200, background: SHADOW.cut, opacity: 0.85 }} />
      ))}
      {card}
    </div>
  );
};

/** The SOURCE tag as a ribbon pinned to the exhibit or object it supports. >= 30 px. */
export const SourceRibbon: React.FC<{ text: string; x: number; y: number; w?: number; rot?: number; z?: number; enter?: number }> = ({ text, x, y, w = 760, rot = -1.5, z = 35, enter = 0 }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [enter, enter + 10], [0, 1], clamp);
  if (o <= 0) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, maxWidth: w, zIndex: z, transform: `rotate(${rot}deg) translateY(${(1 - o) * 8}px)`, opacity: o }}>
      <div
        style={{
          position: "relative",
          background: SHADOW.room,
          boxShadow: `inset 0 0 0 2px ${SHADOW.brass}, 6px 8px 16px ${SHADOW.shade}`,
          padding: "8px 18px 9px 40px",
          fontFamily: COMIC,
          fontWeight: 700,
          fontSize: 30,
          lineHeight: 1.18,
          color: SHADOW.text,
        }}
      >
        {/* brass pin */}
        <div style={{ position: "absolute", left: 10, top: 14, width: 18, height: 18, borderRadius: 9, background: SHADOW.brass, boxShadow: `inset -3px -3px 0 ${SHADOW.brassDark}` }} />
        <span style={{ fontFamily: BANGERS, fontSize: 32, letterSpacing: 2, color: SHADOW.brass, marginRight: 10 }}>SOURCE</span>
        {text}
      </div>
    </div>
  );
};

/** A small paper label on a string, pinned to the thing it describes (a date, place or number). */
export const PaperLabel: React.FC<{ big: string; small?: string; x: number; y: number; pin?: [number, number]; rot?: number; enter?: number; exit?: number; z?: number; w?: number }> = ({
  big,
  small,
  x,
  y,
  pin,
  rot = -2,
  enter = 0,
  exit = 1e9,
  z = 34,
  w,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < enter || frame > exit + 8) return null;
  const k = spring({ frame: frame - enter, fps, config: { damping: 12, stiffness: 160 } });
  const out = interpolate(frame, [exit, exit + 8], [0, 1], clamp);
  const sw = Math.sin((frame - enter) / 22) * 1.2;
  return (
    <>
      {pin ? (
        <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, zIndex: z - 1, overflow: "visible", opacity: k * (1 - out) }}>
          <line x1={pin[0]} y1={pin[1]} x2={x + 30} y2={y + 10} stroke={SHADOW.cut} strokeWidth={3} />
          <circle cx={pin[0]} cy={pin[1]} r={8} fill={SHADOW.brass} stroke={SHADOW.brassDark} strokeWidth={3} />
        </svg>
      ) : null}
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: w,
          zIndex: z,
          opacity: (1 - out) * Math.min(1, k * 2),
          transform: `rotate(${rot + sw}deg) scale(${0.7 + 0.3 * k})`,
          transformOrigin: "30px 10px",
          background: SHADOW.parchment,
          boxShadow: `inset 0 0 0 3px ${SHADOW.scribe}, 8px 10px 20px ${SHADOW.shade}`,
          padding: "12px 22px 10px",
          borderRadius: 4,
        }}
      >
        <div style={{ fontFamily: BANGERS, fontSize: 48, letterSpacing: 2, color: SHADOW.cut, lineHeight: 1.02 }}>{big}</div>
        {small ? <div style={{ fontFamily: COMIC, fontWeight: 700, fontSize: 30, color: SHADOW.scribe, marginTop: 2, lineHeight: 1.15 }}>{small}</div> : null}
      </div>
    </>
  );
};
