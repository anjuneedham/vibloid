import React, { createContext, useContext } from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BoilDefs } from "./BoilDefs";
import { Curator, Dig, Doubt, TheClerk } from "./cast";
import type { Mouth } from "./Clerk";
import { EvidenceRoom } from "./EvidenceRoom";
import { BANGERS, COMIC } from "./fonts";
import { rand } from "./Frame";
import { PAL, THEME } from "./theme";

// Reusable comic-book building blocks for The Evidence Room series.
// Reference look: src/films/reel/Comic.tsx

export const INK = THEME.ink;
export const BORDER = 11;

export type Span = [number, number];
export const inSpan = (f: number, s: Span) => f >= s[0] && f < s[1];
export const anySpan = (f: number, spans: Span[]) => spans.some((s) => inSpan(f, s));

const PanelCtx = createContext({ w: 0, h: 0 });
/** Inner size of the panel you are currently inside. */
export const usePanel = () => useContext(PanelCtx);

export const useSpring = (
  start: number,
  config: { damping: number; stiffness: number; mass: number } = { damping: 11, stiffness: 230, mass: 0.6 },
) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - start, fps, config });
};

export const grad = (a: string, b: string) => `linear-gradient(180deg, ${a} 0%, ${b} 100%)`;

// ---------------------------------------------------------------------------
// PAGE: cream halftone page with shake, white flash and optional slow push-in
// ---------------------------------------------------------------------------
export const ComicPage: React.FC<{
  hits?: number[];
  push?: [number, number, number?];
  children: React.ReactNode;
}> = ({ hits = [], push, children }) => {
  const frame = useCurrentFrame();
  let sx = 0;
  let sy = 0;
  let flash = 0;
  for (const h of hits) {
    const t = frame - h;
    if (t >= 0 && t < 22) {
      const k = 1 - t / 22;
      sx += Math.sin(t * 2.9) * 15 * k;
      sy += Math.cos(t * 3.7) * 10 * k;
    }
    if (t >= 0 && t < 10) flash = Math.max(flash, 0.8 * (1 - t / 10));
  }
  const scale = push
    ? interpolate(frame, [push[0], push[1]], [1, 1 + (push[2] ?? 0.06)], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;
  return (
    <AbsoluteFill style={{ background: PAL.page }}>
      <BoilDefs id="ink" scale={4} rate={8} frequency={0.02} />
      <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px) scale(${scale})`, transformOrigin: "50% 50%" }}>
        <div
          style={{
            position: "absolute",
            left: -90,
            top: -90,
            right: -90,
            bottom: -90,
            backgroundColor: PAL.page,
            backgroundImage: `radial-gradient(circle, ${PAL.pageDots} 3px, transparent 3.6px)`,
            backgroundSize: "22px 22px",
            backgroundPosition: `${frame * 0.2}px ${frame * 0.12}px`,
          }}
        />
        {children}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "#fff", opacity: flash, pointerEvents: "none", zIndex: 500 }} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// PANEL: slams in (spring from 1.18), thick border, hard shadow, halftone dots
// x, y, w, h are the OUTER box. Children are positioned inside the border.
// ---------------------------------------------------------------------------
export const Panel: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  start: number;
  bg: string;
  dots?: string;
  id?: number;
  children: React.ReactNode;
}> = ({ x, y, w, h, start, bg, dots = PAL.dotsDark, id = 0, children }) => {
  const frame = useCurrentFrame();
  const s = useSpring(start, { damping: 13, stiffness: 240, mass: 0.6 });
  if (frame < start) return null;
  const jitter = (rand(Math.floor(frame / 3) + id * 7) - 0.5) * 0.16;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        boxSizing: "border-box",
        border: `${BORDER}px solid ${INK}`,
        background: bg,
        overflow: "hidden",
        transform: `scale(${1.18 - 0.18 * s}) rotate(${jitter}deg)`,
        boxShadow: `10px 12px 0 ${PAL.shadow}`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `radial-gradient(circle, ${dots} 3.2px, transparent 3.8px)`,
          backgroundSize: "18px 18px",
          backgroundPosition: `${frame * 0.15}px ${-frame * 0.1}px`,
        }}
      />
      <PanelCtx.Provider value={{ w: w - BORDER * 2, h: h - BORDER * 2 }}>{children}</PanelCtx.Provider>
    </div>
  );
};

// ---------------------------------------------------------------------------
// ART LAYER: an SVG the size of the panel, lines boiled by the ink filter
// ---------------------------------------------------------------------------
export const Art: React.FC<{ children: React.ReactNode; boil?: boolean }> = ({ children, boil = true }) => {
  const { w, h } = usePanel();
  return (
    <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <g filter={boil ? "url(#ink)" : undefined}>{children}</g>
    </svg>
  );
};

export const Burst: React.FC<{ r: number; spikes: number; fill: string; stroke?: string; rot?: number; sw?: number }> = ({
  r,
  spikes,
  fill,
  stroke = INK,
  rot = 0,
  sw = 9,
}) => {
  const pts = Array.from({ length: spikes * 2 }).map((_, i) => {
    const a = (i / (spikes * 2)) * Math.PI * 2 + rot;
    const rr = i % 2 === 0 ? r : r * (0.58 + rand(i) * 0.1);
    return `${Math.cos(a) * rr},${Math.sin(a) * rr}`;
  });
  return <polygon points={pts.join(" ")} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />;
};

export const SpeedLines: React.FC<{
  cx: number;
  cy: number;
  inner?: number;
  outer?: number;
  count?: number;
  color?: string;
  opacity?: number;
}> = ({ cx, cy, inner = 150, outer = 800, count = 32, color = PAL.burstPale, opacity = 0.55 }) => {
  const frame = useCurrentFrame();
  const { w, h } = usePanel();
  const seed = Math.floor(frame / 2);
  return (
    <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
      {Array.from({ length: count }).map((_, i) => {
        const a = (i / count) * Math.PI * 2 + rand(i + seed * 0.37) * 0.06;
        const r1 = inner + rand(i + seed) * 70;
        return (
          <line
            key={i}
            x1={cx + Math.cos(a) * r1}
            y1={cy + Math.sin(a) * r1}
            x2={cx + Math.cos(a) * outer}
            y2={cy + Math.sin(a) * outer}
            stroke={color}
            strokeWidth={3 + rand(i + seed * 3 + 2) * 7}
            opacity={opacity}
          />
        );
      })}
    </svg>
  );
};

/** Big comic sound-effect / title text: Bangers with a thick ink outline. */
export const BigText: React.FC<{
  children: React.ReactNode;
  fs: number;
  color: string;
  x?: number;
  y?: number;
  w?: number;
  rot?: number;
  scale?: number;
  stroke?: number;
  style?: React.CSSProperties;
}> = ({ children, fs, color, x = 0, y = 0, w, rot = 0, scale = 1, stroke = 9, style }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      textAlign: "center",
      fontFamily: BANGERS,
      fontSize: fs,
      lineHeight: 0.95,
      letterSpacing: 3,
      color,
      WebkitTextStroke: `${stroke}px ${INK}`,
      paintOrder: "stroke fill",
      transform: `rotate(${rot}deg) scale(${scale})`,
      ...style,
    }}
  >
    {children}
  </div>
);

// ---------------------------------------------------------------------------
// SPEECH BUBBLE with a tail
// ---------------------------------------------------------------------------
const bubblePath = (w: number, h: number, tx: number, ty: number) => {
  const r = Math.min(30, h / 2 - 1);
  const cx = w / 2;
  const cy = h / 2;
  const vert = Math.abs(ty - cy) / h >= Math.abs(tx - cx) / w;
  const side = vert ? (ty > cy ? "bottom" : "top") : tx > cx ? "right" : "left";
  const bh = 26;
  const clampX = (v: number) => Math.min(w - r - bh - 6, Math.max(r + bh + 6, v));
  const clampY = (v: number) => Math.min(h - r - bh - 6, Math.max(r + bh + 6, v));
  const ax = clampX((tx + cx) / 2);
  const ay = clampY((ty + cy) / 2);
  let d = `M${r} 0`;
  if (side === "top") d += ` L${ax - bh} 0 L${tx} ${ty} L${ax + bh} 0`;
  d += ` L${w - r} 0 Q${w} 0 ${w} ${r}`;
  if (side === "right") d += ` L${w} ${ay - bh} L${tx} ${ty} L${w} ${ay + bh}`;
  d += ` L${w} ${h - r} Q${w} ${h} ${w - r} ${h}`;
  if (side === "bottom") d += ` L${ax + bh} ${h} L${tx} ${ty} L${ax - bh} ${h}`;
  d += ` L${r} ${h} Q0 ${h} 0 ${h - r}`;
  if (side === "left") d += ` L0 ${ay + bh} L${tx} ${ty} L0 ${ay - bh}`;
  d += ` L0 ${r} Q0 0 ${r} 0 Z`;
  return d;
};

export const bubbleHeight = (chars: number, w: number, fs: number) => {
  const pad = 22;
  const lines = Math.max(1, Math.ceil((chars * fs * 0.54) / (w - 2 * pad)));
  return Math.ceil(lines * fs * 1.18 + pad * 2);
};

export const Bubble: React.FC<{
  span: Span;
  x: number;
  y: number;
  w: number;
  /** tail tip, in panel coordinates */
  tip: [number, number];
  text: React.ReactNode;
  /** length of the text, used to size the bubble */
  chars?: number;
  fs?: number;
  /** y is the bottom edge instead of the top edge */
  anchorBottom?: boolean;
  fill?: string;
}> = ({ span, x, y, w, tip, text, chars, fs = 34, anchorBottom = false, fill = PAL.bubble }) => {
  const frame = useCurrentFrame();
  const s = useSpring(span[0], { damping: 10, stiffness: 240, mass: 0.55 });
  if (!inSpan(frame, span)) return null;
  const n = chars ?? (typeof text === "string" ? text.length : 40);
  const h = bubbleHeight(n, w, fs);
  const top = anchorBottom ? y - h : y;
  const out = interpolate(frame, [span[1] - 3, span[1]], [1, 0.55], { extrapolateLeft: "clamp" });
  const float = Math.sin(frame / 17 + x) * 3;
  const tx = tip[0] - x;
  const ty = tip[1] - top;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: top,
        width: w,
        height: h,
        transform: `translateY(${float}px) scale(${(0.3 + 0.7 * s) * out})`,
        transformOrigin: `${tx}px ${ty}px`,
        opacity: out,
        zIndex: 50,
      }}
    >
      <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", filter: "url(#ink)" }}>
        <path d={bubblePath(w, h, tx, ty)} fill={fill} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "0 22px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          fontFamily: COMIC,
          fontWeight: 700,
          fontSize: fs,
          lineHeight: 1.18,
          color: INK,
        }}
      >
        <div>{text}</div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// YELLOW CAPTION BOX (narration and the Clerk's source stamps)
// ---------------------------------------------------------------------------
export const Caption: React.FC<{
  x: number;
  y: number;
  w: number;
  text: React.ReactNode;
  span: Span;
  fs?: number;
  rot?: number;
}> = ({ x, y, w, text, span, fs = 34, rot = -1 }) => {
  const frame = useCurrentFrame();
  const s = useSpring(span[0], { damping: 12, stiffness: 220, mass: 0.6 });
  if (!inSpan(frame, span)) return null;
  const wob = Math.sin(frame / 21 + y) * 1.2;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + wob,
        width: w,
        boxSizing: "border-box",
        background: PAL.caption,
        border: `7px solid ${INK}`,
        padding: "10px 20px 12px",
        fontFamily: COMIC,
        fontWeight: 700,
        fontSize: fs,
        lineHeight: 1.15,
        color: INK,
        boxShadow: `6px 7px 0 ${PAL.shadow}`,
        transform: `rotate(${rot}deg) scale(${0.6 + 0.4 * s})`,
        transformOrigin: "0 0",
        opacity: Math.min(1, s * 2),
        zIndex: 40,
      }}
    >
      {text}
    </div>
  );
};

// ---------------------------------------------------------------------------
// STAMP: slams down big, with an impact ring
// ---------------------------------------------------------------------------
export const StampMark: React.FC<{
  x: number;
  y: number;
  w: number;
  start: number;
  text: string;
  color: string;
  fs?: number;
  rot?: number;
  bg?: string;
}> = ({ x, y, w, start, text, color, fs = 70, rot = -8, bg = PAL.cardPaper }) => {
  const frame = useCurrentFrame();
  const s = useSpring(start, { damping: 9, stiffness: 280, mass: 0.5 });
  if (frame < start) return null;
  const t = frame - start;
  const ring = t < 12 ? t / 12 : 1;
  const wob = Math.sin(frame / 9 + x) * 0.6;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, zIndex: 60 }}>
      {t < 12 ? (
        <div
          style={{
            position: "absolute",
            left: w / 2 - 20 - ring * w * 0.55,
            top: fs * 0.5 - 20 - ring * w * 0.2,
            width: 40 + ring * w * 1.1,
            height: 40 + ring * w * 0.4,
            borderRadius: "50%",
            border: `${6 * (1 - ring) + 1}px solid ${color}`,
            opacity: 1 - ring,
          }}
        />
      ) : null}
      <div
        style={{
          boxSizing: "border-box",
          width: w,
          textAlign: "center",
          fontFamily: BANGERS,
          fontSize: fs,
          letterSpacing: 3,
          lineHeight: 1,
          padding: "8px 10px 4px",
          color,
          background: bg,
          border: `9px double ${color}`,
          filter: "url(#ink)",
          transform: `rotate(${rot + wob}deg) scale(${1 + (1 - s) * 1.5})`,
          opacity: Math.min(0.96, s * 3),
        }}
      >
        {text}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// ACTORS: the four cast members, standing on a floor line
// ---------------------------------------------------------------------------
export type Who = "curator" | "dig" | "doubt" | "clerk";
const COMPS = { curator: Curator, dig: Dig, doubt: Doubt, clerk: TheClerk } as const;
const SCALE_Y: Record<Who, number> = { curator: 1.1, dig: 0.92, doubt: 1, clerk: 1 };
const REST_MOUTH: Record<Who, Mouth> = { curator: "smirk", dig: "smile", doubt: "flat", clerk: "flat" };

export type ActorBox = { left: number; top: number; width: number; h: number; sy: number };
/** Where a character sits: x = centre, feet = floor y. */
export const actorBox = (who: Who, x: number, feet: number, width: number): ActorBox => {
  const h = width * 1.55;
  return { left: x - width / 2, top: feet - h * (606 / 620), width, h, sy: SCALE_Y[who] };
};
/** Convert a point in the character's own 400x620 drawing space to panel space. */
export const charPt = (b: ActorBox, vx: number, vy: number): [number, number] => {
  const s = b.width / 400;
  const originY = b.top + 0.98 * b.h;
  const py = b.top + vy * s;
  return [b.left + vx * s, originY + (py - originY) * b.sy];
};

export const Actor: React.FC<{
  who: Who;
  x: number;
  feet: number;
  width: number;
  /** frame the character pops in */
  enter?: number;
  /** spans (frames) while this character's bubble is up: the mouth flaps */
  talk?: Span[];
  mouth?: Mouth;
  talkMouth?: Mouth;
  /** frames where the character is hit / startled: squash and stretch */
  hits?: number[];
  /** joyful bouncing, pixels */
  bounce?: number;
  headOnly?: boolean;
  /** headOnly: top-left y instead of feet */
  top?: number;
  browLift?: number;
  browTilt?: number;
  wide?: number;
  lids?: number;
  armL?: number;
  armR?: number;
  headTilt?: number;
  prop?: boolean;
  z?: number;
}> = ({
  who,
  x,
  feet,
  width,
  enter = 0,
  talk = [],
  mouth,
  talkMouth = "open",
  hits = [],
  bounce = 0,
  headOnly = false,
  top,
  z = 10,
  ...expr
}) => {
  const frame = useCurrentFrame();
  const s = useSpring(enter, { damping: 7, stiffness: 190, mass: 0.7 });
  if (frame < enter) return null;
  const Comp = COMPS[who];
  const rest = mouth ?? REST_MOUTH[who];
  const talking = anySpan(frame, talk);
  const m: Mouth = talking ? (Math.floor(frame / 4) % 2 === 0 ? talkMouth : rest === talkMouth ? "flat" : rest) : rest;

  let hit = 0;
  for (const h of hits) {
    const t = frame - h;
    if (t >= 0 && t < 22) hit += Math.exp(-t / 6) * Math.cos(t * 0.8);
  }
  const bnc = bounce ? Math.abs(Math.sin(frame / 5)) : 0;
  const sx = (1 + (1 - s) * 0.28 + hit * 0.16 + bnc * -0.05) * 1;
  const syy = (1 - (1 - s) * 0.28 - hit * 0.16 + bnc * 0.06) * 1;
  const sw = Math.min(18, Math.max(9, (7 * 400) / width));

  const hOnlyH = (width * 290) / 320;
  const b = actorBox(who, x, feet, width);
  const style: React.CSSProperties = headOnly
    ? {
        position: "absolute",
        left: x - width / 2,
        top: top ?? feet - hOnlyH,
        zIndex: z,
        transform: `scale(${sx}, ${syy})`,
        transformOrigin: "50% 100%",
      }
    : {
        position: "absolute",
        left: b.left,
        top: b.top - bnc * bounce,
        zIndex: z,
        transform: `scaleY(${b.sy}) scale(${sx}, ${syy})`,
        transformOrigin: "50% 98%",
      };
  return (
    <div style={style}>
      <Comp width={width} filterId="ink" strokeWidth={sw} mouth={m} headOnly={headOnly} {...expr} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// The Evidence Room set as a panel backdrop (scaled and cropped)
// ---------------------------------------------------------------------------
export const RoomBackdrop: React.FC<{
  scale: number;
  ox: number;
  oy: number;
  lampX?: number;
  floorY?: number;
}> = ({ scale, ox, oy, lampX = 960, floorY = 900 }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top: 0,
      width: 1920,
      height: 1080,
      transform: `translate(${-ox * scale}px, ${-oy * scale}px) scale(${scale})`,
      transformOrigin: "0 0",
    }}
  >
    <EvidenceRoom lampX={lampX} floorY={floorY} />
  </div>
);
