import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { rand } from "../Frame";
import { SHADOW } from "../theme";

/** Lamp flicker, 0.93..1.0: slow smooth value-noise plus a little fast shimmer. Same seed = same lamp. */
export const flickerAt = (frame: number, seed = 0, amount = 1) => {
  const t = frame / 7;
  const i = Math.floor(t);
  const f = t - i;
  const s = (1 - Math.cos(f * Math.PI)) / 2;
  const n = rand(i + seed * 101) * (1 - s) + rand(i + 1 + seed * 101) * s;
  return 1 - amount * (0.05 * n + 0.012 * (1 + Math.sin(frame * 1.9)) + 0.008 * (1 + Math.sin(frame * 4.7 + seed)));
};
export const useFlicker = (seed = 0, amount = 1) => flickerAt(useCurrentFrame(), seed, amount);

/**
 * The backlit paper screen. The lamp sits behind and to one side, so the hot spot is off-centre (default upper left).
 * `hot` is the hot spot in px. `night` cools the far edges (outdoor scenes).
 */
export const Screen: React.FC<{ hot?: [number, number]; spread?: number; night?: number; seed?: number; moon?: boolean }> = ({
  hot = [700, 380],
  spread = 1,
  night = 0,
  seed = 0,
  moon = false,
}) => {
  const { width, height } = useVideoConfig();
  const fl = useFlicker(seed);
  const rx = width * 0.75 * spread;
  const ry = height * 0.95 * spread;
  return (
    <AbsoluteFill style={{ background: SHADOW.screenEdge }}>
      <AbsoluteFill
        style={{
          background: moon
            ? `radial-gradient(${rx}px ${ry}px at ${hot[0]}px ${hot[1]}px, ${SHADOW.nightHot} 0%, ${SHADOW.nightMid} 26%, ${SHADOW.nightDeep} 60%, ${SHADOW.nightEdge} 100%)`
            : `radial-gradient(${rx}px ${ry}px at ${hot[0]}px ${hot[1]}px, ${SHADOW.screenHot} 0%, ${SHADOW.screenWarm} 20%, ${SHADOW.screenAmber} 44%, ${SHADOW.screenDeep} 72%, ${SHADOW.screenEdge} 100%)`,
        }}
      />
      {night > 0 ? (
        <AbsoluteFill
          style={{
            background: `radial-gradient(${rx}px ${ry}px at ${hot[0]}px ${hot[1]}px, rgba(0,0,0,0) 30%, ${SHADOW.gelNight} 100%)`,
            mixBlendMode: "multiply",
            opacity: night,
          }}
        />
      ) : null}
      <AbsoluteFill style={{ background: moon ? SHADOW.nightEdge : SHADOW.room, opacity: (1 - fl) * 2.2 }} />
    </AbsoluteFill>
  );
};

/** Light that spills OVER everything (halation): the hot spot blooms past the cut-out edges. Put it late in the stack. */
export const Bloom: React.FC<{ x: number; y: number; r: number; opacity?: number; seed?: number; color?: string }> = ({
  x,
  y,
  r,
  opacity = 0.35,
  seed = 0,
  color = SHADOW.lampGlow,
}) => {
  const fl = useFlicker(seed);
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: x - r,
          top: y - r,
          width: r * 2,
          height: r * 2,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${color} 0%, rgba(0,0,0,0) 66%)`,
          opacity: opacity * (0.85 + 1.5 * (fl - 0.93)),
        }}
      />
    </AbsoluteFill>
  );
};

/** Warm, soft theatre vignette, slightly heavier on the side away from the lamp. */
export const LampVignette: React.FC<{ hot?: [number, number]; strength?: number }> = ({ hot = [700, 380], strength = 0.92 }) => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(${width * 0.72}px ${height * 0.82}px at ${hot[0] + width * 0.08}px ${hot[1] + height * 0.08}px, rgba(0,0,0,0) 40%, ${SHADOW.room} 112%)`,
        opacity: strength,
        pointerEvents: "none",
      }}
    />
  );
};
