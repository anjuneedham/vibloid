import type { Who } from "../comic";
import { rand } from "../Frame";

// DISTINCT IDLE MOTION per cast member (the drawings are unchanged; only how the rod puppet moves).
//  - THE CURATOR: slow, dignified sway (about 4 s period), head settles with it.
//  - DIG: bouncy. Small hops on the rod, quick sway, restless head.
//  - DOUBT: slumped (leans back, head sunk), barely moves, SLOW blink (eyes shut for ~half a second every ~5 s).
//  - THE CLERK: precise. Stands still, then snaps the head to a new small tilt and holds it, like a bird.

export type Idle = { rot: number; lift: number; headTilt: number; headDrop: number; eyesClosed: boolean; autoBlink: boolean };

const smooth = (t: number) => t * t * (3 - 2 * t);

export const idleMotion = (who: Who, frame: number, seed = 0): Idle => {
  const f = frame + seed * 37;
  if (who === "curator") {
    return {
      rot: Math.sin(f / 38) * 1.1,
      lift: Math.max(0, Math.sin(f / 19)) * 1.2,
      headTilt: Math.sin(f / 38 - 0.7) * 1.8,
      headDrop: 0,
      eyesClosed: false,
      autoBlink: true,
    };
  }
  if (who === "dig") {
    return {
      rot: Math.sin(f / 11) * 1.6,
      lift: Math.abs(Math.sin(f / 6.2)) * 7,
      headTilt: Math.sin(f / 8.5) * 2.6,
      headDrop: 0,
      eyesClosed: false,
      autoBlink: true,
    };
  }
  if (who === "doubt") {
    // slow blink: closes over the 16-frame window, every 150 frames
    const ph = f % 150;
    return {
      rot: -1.8 + Math.sin(f / 70) * 0.5,
      lift: -2 + Math.sin(f / 55) * 1.2,
      headTilt: -2.5 + Math.sin(f / 90) * 1,
      headDrop: 7,
      eyesClosed: ph > 132,
      autoBlink: false,
    };
  }
  // clerk: hold a tilt for ~1.5 s, snap to the next in 5 frames
  const step = 46;
  const i = Math.floor(f / step);
  const tilts = (k: number) => [0, 5, 0, -4, 2, -2][Math.floor(rand(k * 3.1 + seed) * 6)];
  const t = smooth(Math.min(1, (f % step) / 5));
  return {
    rot: Math.sin(f / 60) * 0.25,
    lift: 0,
    headTilt: tilts(i - 1) + (tilts(i) - tilts(i - 1)) * t,
    headDrop: 0,
    eyesClosed: false,
    autoBlink: true,
  };
};
