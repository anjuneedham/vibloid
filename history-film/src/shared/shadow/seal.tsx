import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BANGERS } from "../fonts";
import { rand } from "../Frame";
import { SHADOW } from "../theme";
import { useFlicker } from "./light";
import { ScriptLines } from "./slide";
import { tornRect } from "./gel";

/** A sheet of parchment lit from behind: it glows, shows its fibres, and its deckled edges go dark. */
export const GlowParchment: React.FC<{ x: number; y: number; w: number; h: number; rot?: number; writing?: boolean; children?: React.ReactNode }> = ({
  x,
  y,
  w,
  h,
  rot = 0,
  writing = true,
  children,
}) => {
  const fl = useFlicker(5);
  return (
    <svg width={w + 80} height={h + 80} style={{ position: "absolute", left: x - 40, top: y - 40, transform: `rotate(${rot}deg)`, overflow: "visible" }}>
      <defs>
        <radialGradient id="pglow" cx="45%" cy="42%" r="70%">
          <stop offset="0" stopColor={SHADOW.screenHot} />
          <stop offset="0.55" stopColor={SHADOW.parchment} />
          <stop offset="1" stopColor={SHADOW.vellumDark} />
        </radialGradient>
        <filter id="pedge">
          <feGaussianBlur stdDeviation={10} />
        </filter>
      </defs>
      <g transform="translate(40 40)">
        <path d={tornRect(0, 0, w, h, 7, 16, 30)} fill={SHADOW.screenEdge} opacity={0.5} filter="url(#pedge)" transform="translate(14 16)" />
        <path d={tornRect(0, 0, w, h, 7, 16, 30)} fill="url(#pglow)" opacity={0.92 + (fl - 0.93)} />
        <path d={tornRect(0, 0, w, h, 7, 16, 30)} fill="none" stroke={SHADOW.vellumDark} strokeWidth={8} opacity={0.7} filter="url(#pedge)" />
        {writing ? (
          <g opacity={0.22}>
            <ScriptLines x={60} y={70} w={w - 120} rows={2} seed={77} />
          </g>
        ) : null}
        {children}
      </g>
    </svg>
  );
};

const blob = (r: number, seed: number, grow: number) => {
  const n = 40;
  let d = "";
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (1 + 0.07 * (rand(seed + (i % n)) - 0.5) * 2 * grow + 0.03 * Math.sin(a * 5 + seed));
    d += `${i === 0 ? "M" : "L"}${(Math.cos(a) * rr).toFixed(1)} ${(Math.sin(a) * rr).toFixed(1)} `;
  }
  return d + "Z";
};

/**
 * The verdict: a brass seal matrix comes down and presses a wax seal into the glowing parchment at `hit`.
 * Render inside an <svg>. Returns nothing before `hit - 14`.
 */
export const WaxSeal: React.FC<{ cx: number; cy: number; r: number; hit: number; ring?: string; mono?: string }> = ({
  cx,
  cy,
  r,
  hit,
  ring = "THE EVIDENCE ROOM · PAST TENSE · ",
  mono = "ER",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame - hit;
  if (t < -14) return null;
  const spread = spring({ frame: t, fps, config: { damping: 14, stiffness: 160, mass: 0.7 } });
  // matrix: down over 14 frames, pressed for 8, lifts away
  const my = t < 0 ? interpolate(t, [-14, 0], [-r * 4.5, 0], { easing: (x) => x * x }) : t < 4 ? Math.sin(t) * 2 : interpolate(t, [4, 20], [0, -r * 5], { extrapolateRight: "clamp", easing: (x) => x * x });
  const squash = t >= 0 && t < 6 ? 1 - 0.06 * Math.sin((t / 6) * Math.PI) : 1;
  const pressed = t >= 0;
  const id = `seal${Math.round(cx)}`;
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-w`} cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor={SHADOW.waxHi} />
          <stop offset="0.45" stopColor={SHADOW.wax} />
          <stop offset="1" stopColor={SHADOW.waxDeep} />
        </radialGradient>
        <radialGradient id={`${id}-in`} cx="60%" cy="65%" r="70%">
          <stop offset="0" stopColor={SHADOW.waxHi} stopOpacity={0.35} />
          <stop offset="1" stopColor={SHADOW.waxDeep} stopOpacity={0.6} />
        </radialGradient>
        <path id={`${id}-arc`} d={`M ${-r * 0.74} 0 A ${r * 0.74} ${r * 0.74} 0 1 1 ${r * 0.74} 0 A ${r * 0.74} ${r * 0.74} 0 1 1 ${-r * 0.74} 0`} />
        <filter id={`${id}-sh`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={8} />
        </filter>
      </defs>
      <g transform={`translate(${cx} ${cy})`}>
        {pressed ? (
          <g transform={`scale(${0.55 + 0.45 * spread})`}>
            <path d={blob(r * 1.08, 3, spread)} fill={SHADOW.waxDeep} opacity={0.55} transform="translate(8 10)" filter={`url(#${id}-sh)`} />
            <path d={blob(r * 1.08, 3, spread)} fill={`url(#${id}-w)`} />
            {/* pressed well */}
            <circle r={r * 0.86} fill={`url(#${id}-in)`} />
            <circle r={r * 0.86} fill="none" stroke={SHADOW.waxDeep} strokeWidth={5} transform="translate(2 2)" opacity={0.8} />
            <circle r={r * 0.86} fill="none" stroke={SHADOW.waxHi} strokeWidth={3} transform="translate(-2 -2)" opacity={0.7} />
            <circle r={r * 0.6} fill="none" stroke={SHADOW.waxDeep} strokeWidth={4} opacity={0.7} />
            {/* embossed ring text and monogram: dark lower-right edge + light upper-left edge */}
            {[
              [2, 2, SHADOW.waxDeep],
              [-1.5, -1.5, SHADOW.waxHi],
              [0, 0, SHADOW.wax],
            ].map(([dx, dy, c], i) => (
              <g key={i} transform={`translate(${dx} ${dy})`} fill={c as string}>
                <text fontFamily={BANGERS} fontSize={r * 0.17} letterSpacing={r * 0.02}>
                  <textPath href={`#${id}-arc`}>{ring + ring}</textPath>
                </text>
                <text y={r * 0.2} textAnchor="middle" fontFamily={BANGERS} fontSize={r * 0.62} letterSpacing={2}>
                  {mono}
                </text>
              </g>
            ))}
            {/* gloss */}
            <ellipse cx={-r * 0.38} cy={-r * 0.52} rx={r * 0.28} ry={r * 0.1} fill={SHADOW.screenHot} opacity={0.35} transform={`rotate(-30 ${-r * 0.38} ${-r * 0.52})`} />
          </g>
        ) : null}
        {/* the seal matrix: a turned wooden handle on a brass die, seen from the side */}
        <g transform={`translate(0 ${my}) scale(1 ${squash})`} opacity={t < 22 ? 1 : 0}>
          <path
            d={`M ${-r * 0.16} ${-r * 0.42} C ${-r * 0.2} ${-r * 1.0}, ${-r * 0.08} ${-r * 1.5}, ${-r * 0.12} ${-r * 1.9} C ${-r * 0.34} ${-r * 2.05}, ${-r * 0.36} ${-r * 2.55}, 0 ${-r * 2.62} C ${r * 0.36} ${-r * 2.55}, ${r * 0.34} ${-r * 2.05}, ${r * 0.12} ${-r * 1.9} C ${r * 0.08} ${-r * 1.5}, ${r * 0.2} ${-r * 1.0}, ${r * 0.16} ${-r * 0.42} Z`}
            fill={SHADOW.cutMid}
          />
          <path d={`M ${-r * 0.08} ${-r * 2.45} Q ${-r * 0.22} ${-r * 2.2} ${-r * 0.1} ${-r * 1.98}`} stroke={SHADOW.rim} strokeWidth={4} fill="none" opacity={0.5} />
          <path d={`M ${-r * 0.5} ${-r * 0.42} L ${r * 0.5} ${-r * 0.42} L ${r * 0.62} ${-r * 0.12} L ${-r * 0.62} ${-r * 0.12} Z`} fill={SHADOW.brassDark} />
          <rect x={-r * 0.62} y={-r * 0.14} width={r * 1.24} height={r * 0.14} fill={SHADOW.brass} />
          <rect x={-r * 0.5} y={-r * 0.4} width={r * 0.22} height={r * 0.26} fill={SHADOW.brass} opacity={0.55} />
        </g>
      </g>
    </g>
  );
};

/** Warm flash and a gentle (not comic) nudge when the seal lands. */
export const useSealImpact = (hit: number) => {
  const frame = useCurrentFrame();
  const t = frame - hit;
  const nudge = t >= 0 && t < 14 ? Math.sin(t * 2.4) * 4 * (1 - t / 14) : 0;
  const flash = t >= 0 && t < 10 ? 0.35 * (1 - t / 10) ** 2 : 0;
  return { nudge, flash };
};

export const WarmFlash: React.FC<{ amount: number }> = ({ amount }) =>
  amount > 0 ? <AbsoluteFill style={{ background: SHADOW.lampCore, opacity: amount, mixBlendMode: "screen", zIndex: 650, pointerEvents: "none" }} /> : null;
