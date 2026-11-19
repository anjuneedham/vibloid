import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BANGERS } from "./fonts";
import { BAR_HEIGHT, THEME } from "./theme";

export const Letterbox: React.FC = () => (
  <>
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: "100%",
        height: BAR_HEIGHT,
        background: "#000",
        zIndex: 1000,
      }}
    />
    <div
      style={{
        position: "absolute",
        left: 0,
        bottom: 0,
        width: "100%",
        height: BAR_HEIGHT,
        background: "#000",
        zIndex: 1000,
      }}
    />
  </>
);

export const Wordmark: React.FC<{ opacity?: number }> = ({ opacity = 0.5 }) => (
  <div
    style={{
      position: "absolute",
      right: 44,
      bottom: BAR_HEIGHT + 20,
      fontFamily: BANGERS,
      fontSize: 34,
      letterSpacing: 2,
      color: THEME.white,
      opacity,
      zIndex: 900,
      textShadow: "0 2px 6px rgba(0,0,0,0.6)",
    }}
  >
    PAST <span style={{ color: THEME.card }}>TENSE</span>
  </div>
);

export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.85 }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,${strength}) 100%)`,
      pointerEvents: "none",
      zIndex: 800,
    }}
  />
);

// Deterministic pseudo random so every frame renders identically.
export const rand = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export const Dust: React.FC<{ color?: string; count?: number; opacity?: number }> = ({
  color = "#FFD9A0",
  count = 45,
  opacity = 0.5,
}) => {
  const frame = useCurrentFrame();
  return (
    <svg
      width={1920}
      height={1080}
      style={{ position: "absolute", left: 0, top: 0, zIndex: 700, pointerEvents: "none" }}
    >
      {Array.from({ length: count }).map((_, i) => {
        const speed = 0.15 + rand(i + 1) * 0.4;
        const x = (rand(i + 11) * 1920 + Math.sin(frame / 40 + i) * 30 + frame * speed * 0.4) % 1920;
        const y = (rand(i + 21) * 1080 - frame * speed * 0.6 + 1080 * 10) % 1080;
        const r = 1.2 + rand(i + 31) * 2.4;
        const tw = 0.4 + 0.6 * Math.abs(Math.sin(frame / 25 + i));
        return <circle key={i} cx={x} cy={y} r={r} fill={color} opacity={opacity * tw} />;
      })}
    </svg>
  );
};

export const Glow: React.FC<{
  x: number;
  y: number;
  size: number;
  color: string;
  opacity?: number;
  flicker?: number;
}> = ({ x, y, size, color, opacity = 0.6, flicker = 0.08 }) => {
  const frame = useCurrentFrame();
  const f =
    1 +
    flicker * Math.sin(frame * 0.9) +
    flicker * 0.6 * Math.sin(frame * 2.3 + 1) +
    flicker * 0.4 * Math.sin(frame * 5.1);
  return (
    <div
      style={{
        position: "absolute",
        left: x - size,
        top: y - size,
        width: size * 2,
        height: size * 2,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color} 0%, rgba(0,0,0,0) 68%)`,
        opacity: opacity * f,
        transform: `scale(${0.97 + 0.03 * f})`,
        pointerEvents: "none",
      }}
    />
  );
};

export const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** Subtle paper / print grain overlay. */
export const Grain: React.FC<{ opacity?: number; blend?: React.CSSProperties["mixBlendMode"] }> = ({
  opacity = 0.25,
  blend = "multiply",
}) => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.3  0 0 0 0 0.25  0 0 0 0 0.2  0 0 0 0.9 0'/></filter><rect width='400' height='400' filter='url(#n)'/></svg>`;
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`,
        opacity,
        mixBlendMode: blend,
        pointerEvents: "none",
      }}
    />
  );
};
