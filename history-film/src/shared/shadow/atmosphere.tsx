import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { rand } from "../Frame";
import { SHADOW } from "../theme";

/** Dust drifting through the lamp beam: brightest near the lamp, fading with distance. */
export const BeamDust: React.FC<{ lamp: [number, number]; count?: number; reach?: number; seed?: number }> = ({
  lamp,
  count = 60,
  reach = 900,
  seed = 0,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <svg width={width} height={height} style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none", mixBlendMode: "screen" }}>
      {Array.from({ length: count }).map((_, i) => {
        const k = i + seed * 97;
        const sp = 0.12 + rand(k + 1) * 0.35;
        const x = ((rand(k + 2) * width + frame * sp * 0.6 + Math.sin(frame / 47 + k) * 26) % (width + 40)) - 20;
        const y = ((rand(k + 3) * height + frame * sp * (rand(k + 5) > 0.5 ? 0.35 : -0.25) + height * 20) % height);
        const d = Math.hypot(x - lamp[0], y - lamp[1]);
        const lit = Math.max(0, 1 - d / reach);
        const tw = 0.5 + 0.5 * Math.sin(frame / (9 + rand(k + 7) * 14) + k);
        const r = 1 + rand(k + 4) * 2.6;
        return <circle key={i} cx={x} cy={y} r={r} fill={SHADOW.dust} opacity={lit * (0.25 + 0.6 * tw)} />;
      })}
    </svg>
  );
};

const MothShape: React.FC<{ open: number }> = ({ open }) => (
  <g>
    <g transform={`scale(${open} 1)`}>
      <path d="M0 -4 L -30 6 Q -26 14 -6 10 Z" />
      <path d="M0 -4 L 30 6 Q 26 14 6 10 Z" />
      <path d="M-2 4 Q -16 18 -10 20 Q -2 16 0 8 Z" opacity={0.8} />
      <path d="M2 4 Q 16 18 10 20 Q 2 16 0 8 Z" opacity={0.8} />
    </g>
    <ellipse cx={0} cy={5} rx={2.6} ry={9} />
    <path d="M-1 -6 Q -6 -16 -10 -18 M1 -6 Q 6 -16 10 -18" stroke="currentColor" strokeWidth={1.4} fill="none" />
  </g>
);

/** Moths circling the lamp. Each also throws a large soft shadow onto the screen when it crosses the light. */
export const Moths: React.FC<{ lamp: [number, number]; count?: number; radius?: number; seed?: number; shadows?: boolean }> = ({
  lamp,
  count = 3,
  radius = 170,
  seed = 0,
  shadows = true,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <svg width={width} height={height} style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none", overflow: "visible" }}>
      <defs>
        <filter id={`mothsoft-${seed}`} x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation={9} />
        </filter>
        <filter id={`mothnear-${seed}`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation={1.8} />
        </filter>
      </defs>
      {Array.from({ length: count }).map((_, i) => {
        const k = i + seed * 31;
        const sp = 0.035 + rand(k + 1) * 0.03;
        const a = frame * sp * (rand(k + 2) > 0.5 ? 1 : -1) + rand(k + 3) * 6.28;
        const wob = Math.sin(frame / 5.3 + k) * 22 + Math.sin(frame / 2.1 + k * 3) * 7;
        const r = radius * (0.55 + rand(k + 4) * 0.6);
        const x = lamp[0] + Math.cos(a) * r + wob;
        const y = lamp[1] + Math.sin(a * 1.3) * r * 0.55 + Math.cos(frame / 7 + k) * 12;
        const open = 0.35 + 0.65 * Math.abs(Math.sin(frame * 0.9 + k));
        const tilt = Math.cos(a) * 30;
        // shadow on the screen: the moth is near the lamp, so its shadow is big and soft, pushed away from the lamp
        const sx = lamp[0] + (x - lamp[0]) * 2.6;
        const sy = lamp[1] + (y - lamp[1]) * 2.6;
        return (
          <g key={i}>
            {shadows ? (
              <g transform={`translate(${sx} ${sy}) rotate(${tilt}) scale(3.4)`} fill={SHADOW.cut} color={SHADOW.cut} opacity={0.14} filter={`url(#mothsoft-${seed})`}>
                <MothShape open={open} />
              </g>
            ) : null}
            <g transform={`translate(${x} ${y}) rotate(${tilt}) scale(${0.5 + rand(k + 6) * 0.25})`} fill={SHADOW.cutMid} color={SHADOW.cutMid} filter={`url(#mothnear-${seed})`}>
              <MothShape open={open} />
            </g>
          </g>
        );
      })}
    </svg>
  );
};
