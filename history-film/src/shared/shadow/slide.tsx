import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { BANGERS, COMIC } from "../fonts";
import { rand } from "../Frame";
import { SHADOW } from "../theme";
import { flickerAt } from "./light";

/**
 * A backlit lantern slide: glass in a dark wooden mount, sliding into the carrier and pulling focus.
 * `children` is SVG art in a 1000 x 680 viewBox.
 */
export const LanternSlide: React.FC<{
  x: number;
  y: number;
  w: number;
  enter: number;
  label?: string;
  children: React.ReactNode;
  tilt?: number;
}> = ({ x, y, w, enter, label, children, tilt = -1.2 }) => {
  const frame = useCurrentFrame();
  const t = frame - enter;
  if (t < 0) return null;
  const h = (w * 680) / 1000;
  const slide = interpolate(t, [0, 16], [-w * 0.35, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const focus = interpolate(t, [4, 26], [9, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const o = interpolate(t, [0, 6], [0, 1], { extrapolateRight: "clamp" });
  const fl = flickerAt(frame, 3);
  const push = 1 + Math.min(1, t / 240) * 0.03;
  const mount = 38;
  return (
    <div
      style={{
        position: "absolute",
        left: x + slide,
        top: y,
        width: w + mount * 2,
        height: h + mount * 2 + (label ? 44 : 0),
        opacity: o,
        transform: `rotate(${tilt}deg) scale(${push})`,
        transformOrigin: "50% 50%",
        zIndex: 40,
      }}
    >
      {/* projected halo around the slide */}
      <div
        style={{
          position: "absolute",
          inset: -120,
          background: `radial-gradient(closest-side, ${SHADOW.lampGlow} 0%, rgba(0,0,0,0) 100%)`,
          opacity: 0.45 * fl,
          mixBlendMode: "screen",
        }}
      />
      {/* wooden mount */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(135deg, ${SHADOW.cutMid} 0%, ${SHADOW.cut} 70%)`,
          borderRadius: 10,
          boxShadow: `inset 2px 2px 0 ${SHADOW.brassDark}, 0 18px 50px ${SHADOW.shade}`,
        }}
      />
      {/* the glass, lit from behind */}
      <div
        style={{
          position: "absolute",
          left: mount,
          top: mount,
          width: w,
          height: h,
          borderRadius: 22,
          overflow: "hidden",
          background: SHADOW.slideGlass,
          boxShadow: `0 0 40px ${SHADOW.lampGlow}`,
          filter: `blur(${focus}px) brightness(${0.95 + (fl - 0.93) * 1.4})`,
        }}
      >
        <svg viewBox="0 0 1000 680" width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
          {children}
          {/* glass dirt: specks and one hair */}
          {Array.from({ length: 22 }).map((_, i) => (
            <circle key={i} cx={rand(i + 40) * 1000} cy={rand(i + 70) * 680} r={0.8 + rand(i + 90) * 2.2} fill={SHADOW.scribe} opacity={0.35} />
          ))}
          <path d="M760 90 Q 790 140 770 190 Q 752 232 790 270" stroke={SHADOW.scribe} strokeWidth={1.4} fill="none" opacity={0.35} />
        </svg>
        {/* lens vignette: the lantern's circle of light */}
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 45% 45%, rgba(0,0,0,0) 55%, ${SHADOW.screenDeep} 130%)`, opacity: 0.8 }} />
      </div>
      {label ? (
        <div
          style={{
            position: "absolute",
            left: mount,
            right: mount,
            bottom: 14,
            textAlign: "center",
            fontFamily: COMIC,
            fontWeight: 700,
            fontSize: 24,
            color: SHADOW.textDim,
            letterSpacing: 1,
          }}
        >
          <span style={{ fontFamily: BANGERS, color: SHADOW.brass, letterSpacing: 3, marginRight: 10 }}>EXHIBIT A</span>
          {label}
        </div>
      ) : null}
    </div>
  );
};

/** Asemic script: rows of pen strokes that read as handwriting at a glance without pretending to be a real text. */
export const ScriptLines: React.FC<{ x: number; y: number; w: number; rows: number; gap?: number; seed?: number; color?: string; size?: number; skipFirst?: number }> = ({
  x,
  y,
  w,
  rows,
  gap = 34,
  seed = 1,
  color = SHADOW.scribe,
  size = 1,
  skipFirst = 0,
}) => {
  const out: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    let cx = x + (r < 1 ? skipFirst : 0);
    const end = x + w - (r === rows - 1 ? w * 0.4 : rand(seed + r) * 30);
    let d = "";
    let k = 0;
    while (cx < end) {
      const ww = (14 + rand(seed * 7 + r * 31 + k) * 46) * size;
      const by = y + r * gap;
      // a "word": a run of minims (short down strokes joined at the top), the look of gothic book hand
      const n = Math.max(2, Math.round(ww / (7 * size)));
      for (let m = 0; m < n; m++) {
        const mx = cx + m * 7 * size;
        const tall = rand(seed + r * 3 + k * 5 + m) > 0.86 ? 10 * size : 0;
        d += `M${mx} ${by - 9 * size - tall} L${mx + 1.5 * size} ${by} `;
        if (m < n - 1) d += `M${mx} ${by - 9 * size} L${mx + 7 * size} ${by - 10 * size} `;
      }
      cx += ww + 12 * size;
      k++;
    }
    out.push(<path key={r} d={d} stroke={color} strokeWidth={2.6 * size} strokeLinecap="round" fill="none" />);
  }
  return <g>{out}</g>;
};

/** A medieval manuscript page (drawn, not copied): two ruled columns, a red-and-gold initial, a marginal round table. */
export const ManuscriptArt: React.FC<{ reveal?: number }> = ({ reveal = 1 }) => (
  <g>
    <rect width={1000} height={680} fill={SHADOW.vellum} />
    <rect x={18} y={18} width={964} height={644} fill="none" stroke={SHADOW.vellumDark} strokeWidth={10} opacity={0.6} />
    {/* initial */}
    <rect x={92} y={70} width={120} height={120} fill={SHADOW.gold} stroke={SHADOW.rubric} strokeWidth={6} />
    <text x={152} y={170} textAnchor="middle" fontFamily={BANGERS} fontSize={118} fill={SHADOW.rubric}>
      G
    </text>
    <path d="M92 190 Q 60 260 96 330 Q 120 380 88 440" stroke={SHADOW.rubric} strokeWidth={5} fill="none" />
    <circle cx={96} cy={330} r={8} fill={SHADOW.gold} />
    <circle cx={88} cy={440} r={8} fill={SHADOW.gold} />
    <g opacity={reveal}>
      <ScriptLines x={230} y={96} w={300} rows={3} seed={3} />
      <ScriptLines x={110} y={232} w={420} rows={11} seed={9} />
      <ScriptLines x={580} y={96} w={330} rows={6} seed={21} />
      {/* rubric line in red */}
      <ScriptLines x={580} y={300} w={330} rows={1} seed={44} color={SHADOW.rubric} />
      <ScriptLines x={580} y={334} w={330} rows={8} seed={57} />
    </g>
    {/* marginal drawing: a round table with a crown */}
    <g transform="translate(880 560)">
      <ellipse rx={62} ry={22} fill="none" stroke={SHADOW.scribe} strokeWidth={4} />
      {Array.from({ length: 8 }).map((_, i) => (
        <circle key={i} cx={Math.cos((i / 8) * Math.PI * 2) * 76} cy={Math.sin((i / 8) * Math.PI * 2) * 30} r={6} fill={SHADOW.rubric} />
      ))}
      <path d="M-22 -40 L-22 -62 L-11 -50 L0 -66 L11 -50 L22 -62 L22 -40 Z" fill={SHADOW.gold} stroke={SHADOW.scribe} strokeWidth={3} />
    </g>
  </g>
);
