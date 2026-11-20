import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { rand } from "../Frame";

/** Torn-tissue edge: a closed path around a rectangle with deterministic ragged jitter. */
export const tornRect = (x: number, y: number, w: number, h: number, seed: number, rough = 14, step = 38) => {
  const pts: [number, number][] = [];
  const j = (i: number) => (rand(seed * 13 + i * 1.7) - 0.5) * rough;
  let i = 0;
  for (let t = 0; t < w; t += step) pts.push([x + t, y + j(i++)]);
  for (let t = 0; t < h; t += step) pts.push([x + w + j(i++), y + t]);
  for (let t = w; t > 0; t -= step) pts.push([x + t, y + h + j(i++)]);
  for (let t = h; t > 0; t -= step) pts.push([x + j(i++), y + t]);
  return `M${pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L")} Z`;
};

/**
 * A translucent coloured gel (tissue) laid over the stage for mood: amber warmth, teal night, rose for verdicts.
 * Multiply-blended, so it tints the lit screen and leaves the black cut-outs black.
 */
export const Gel: React.FC<{
  color: string;
  x: number;
  y: number;
  w: number;
  h: number;
  opacity?: number;
  rot?: number;
  seed?: number;
  drift?: number;
  feather?: number;
}> = ({ color, x, y, w, h, opacity = 0.45, rot = 0, seed = 1, drift = 6, feather = 0 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const dx = Math.sin(frame / 90 + seed) * drift;
  const dy = Math.cos(frame / 110 + seed) * drift * 0.5;
  const d = tornRect(x, y, w, h, seed, 18, 46);
  return (
    <svg
      width={width}
      height={height}
      style={{ position: "absolute", left: 0, top: 0, mixBlendMode: "multiply", pointerEvents: "none", overflow: "visible", filter: feather ? `blur(${feather}px)` : undefined }}
    >
      <g transform={`translate(${dx} ${dy}) rotate(${rot} ${x + w / 2} ${y + h / 2})`}>
        <path d={d} fill={color} opacity={opacity} />
        {/* doubled edge where the tissue overlaps itself */}
        <path d={d} fill="none" stroke={color} strokeWidth={7} opacity={opacity * 0.8} />
      </g>
    </svg>
  );
};
