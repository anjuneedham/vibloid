import React from "react";
import { useCurrentFrame } from "remotion";
import { rand } from "../Frame";

/**
 * Ink-wipe reveal: the brayer rolls ink across the block, leaving a ragged leading edge.
 * `dir` = which way the roller travels. Progress moves on twos.
 */
export const InkWipe: React.FC<{ start: number; dur?: number; dir?: "right" | "down" | "left"; seed?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  start,
  dur = 8,
  dir = "right",
  seed = 1,
  children,
  style,
}) => {
  const frame = useCurrentFrame();
  const t = Math.floor((frame - start) / 2) * 2;
  if (t < 0) return null;
  const p = Math.min(1, t / dur);
  if (p >= 1) return <div style={{ position: "absolute", inset: 0, ...style }}>{children}</div>;
  const n = 18;
  const edge: string[] = [];
  for (let i = 0; i <= n; i++) {
    const j = (rand(seed * 17 + i) - 0.5) * 8; // percent
    const along = (i / n) * 100;
    const at = Math.max(0, Math.min(100, p * 112 - 6 + j));
    edge.push(dir === "down" ? `${along}% ${at}%` : dir === "left" ? `${100 - at}% ${along}%` : `${at}% ${along}%`);
  }
  const poly =
    dir === "down"
      ? `polygon(0% 0%, 100% 0%, ${edge.reverse().join(", ")})`
      : dir === "left"
        ? `polygon(100% 0%, 100% 100%, ${edge.reverse().join(", ")})`
        : `polygon(0% 0%, ${edge.join(", ")}, 0% 100%)`;
  return <div style={{ position: "absolute", inset: 0, clipPath: poly, ...style }}>{children}</div>;
};
