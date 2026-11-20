import React from "react";
import { Freeze, interpolate, useCurrentFrame } from "remotion";
import { Curator, Dig, Doubt, TheClerk } from "./cast";
import type { ClerkPalette, ClerkProps, Mouth } from "./Clerk";
import { actorBox, Who } from "./comic";
import type { Span } from "./moment";

// One of the four cast members, UNCHANGED (src/shared/cast.tsx), placed on a floor line.
// Styles may add a treatment around them (CSS filter / colour grade, palette for print styles, stepped timing)
// but never change their drawing.

const COMPS = { curator: Curator, dig: Dig, doubt: Doubt, clerk: TheClerk } as const;
export const REST_MOUTH: Record<Who, Mouth> = { curator: "smirk", dig: "smile", doubt: "flat", clerk: "flat" };

export type PlayerProps = {
  who: Who;
  x: number;
  feet: number;
  width: number;
  talk?: Span[];
  mouth?: Mouth;
  talkMouth?: Mouth;
  /** frame the actor fades / rises in (calm entrance). Omit for always there. */
  enter?: number;
  /** pop entrance instead of a fade (print styles) */
  pop?: boolean;
  bounce?: number;
  palette?: Partial<ClerkPalette>;
  filterId?: string;
  strokeWidth?: number;
  /** CSS filter on the whole actor: colour grade, rim light (drop-shadow) */
  cssFilter?: string;
  /** hold every n frames (2 = "on twos"): print styles */
  step?: number;
  opacity?: number;
  z?: number;
  /** gentle whole-body sway in degrees */
  sway?: number;
} & Pick<ClerkProps, "browLift" | "browTilt" | "wide" | "lids" | "armL" | "armR" | "headTilt" | "prop" | "eyesClosed" | "autoBlink">;

export const Player: React.FC<PlayerProps> = ({
  who,
  x,
  feet,
  width,
  talk = [],
  mouth,
  talkMouth = "open",
  enter,
  pop = false,
  bounce = 0,
  palette,
  filterId,
  strokeWidth,
  cssFilter,
  step = 1,
  opacity = 1,
  z = 10,
  sway = 0,
  ...expr
}) => {
  const real = useCurrentFrame();
  const frame = step > 1 ? Math.floor(real / step) * step : real;
  if (enter !== undefined && real < enter) return null;
  const Comp = COMPS[who];
  const rest = mouth ?? REST_MOUTH[who];
  const talking = talk.some((s) => frame >= s[0] && frame < s[1]);
  const m: Mouth = talking ? (Math.floor(frame / 4) % 2 === 0 ? talkMouth : rest === talkMouth ? "flat" : rest) : rest;
  const k = enter === undefined ? 1 : interpolate(frame - enter, [0, pop ? 4 : 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const b = actorBox(who, x, feet, width);
  const bnc = bounce ? Math.abs(Math.sin(frame / 5)) * bounce : 0;
  const sw = strokeWidth ?? Math.min(18, Math.max(9, (7 * 400) / width));
  const rot = sway ? Math.sin(frame / 23 + x) * sway : 0;
  const popS = pop ? 1 + (1 - k) * 0.25 : 1;
  // cast.tsx spreads props last, so only pass a palette when a style really overrides it
  const pal = palette ? { palette } : {};
  const el = <Comp width={width} filterId={filterId} strokeWidth={sw} mouth={m} {...pal} {...expr} />;
  return (
    <div
      style={{
        position: "absolute",
        left: b.left,
        top: b.top - bnc + (pop ? 0 : (1 - k) * 24),
        zIndex: z,
        opacity: opacity * (pop ? Math.min(1, k * 2) : k),
        transform: `scaleY(${b.sy}) rotate(${rot}deg) scale(${popS})`,
        transformOrigin: "50% 98%",
        filter: cssFilter,
      }}
    >
      {step > 1 ? <Freeze frame={frame}>{el}</Freeze> : el}
    </div>
  );
};

/** Where a point of the actor's 400x620 drawing lands on screen (for rods, props, speech anchors). */
export const actorPoint = (who: Who, x: number, feet: number, width: number, vx: number, vy: number): [number, number] => {
  const b = actorBox(who, x, feet, width);
  const s = width / 400;
  const originY = b.top + 0.98 * b.h;
  const py = b.top + vy * s;
  return [b.left + vx * s, originY + (py - originY) * b.sy];
};
