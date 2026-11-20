import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { actorBox } from "../comic";
import { Player, PlayerProps } from "../Player";
import { SHADOW } from "../theme";
import { idleMotion } from "./idle";

const BLACK = {
  ink: SHADOW.cut,
  skin: SHADOW.cut,
  coat: SHADOW.cut,
  shirt: SHADOW.cut,
  accent: SHADOW.cut,
  lens: SHADOW.cut,
  glass: SHADOW.cut,
  eye: SHADOW.cut,
  hat: SHADOW.cut,
  trim: SHADOW.cut,
};

/**
 * A cast member (drawn exactly as in cast.tsx) standing in front of the backlit screen:
 * - a warm colour grade and a lamp-side rim light,
 * - their shadow thrown onto the paper screen behind them (bigger, softer, pushed away from the lamp),
 * - a thin control rod running down out of frame, so they read as a figure on the theatre stage,
 * - their own idle motion (idle.ts) unless `idle={false}`; headTilt / headDrop passed in are ADDED to it,
 * - the boiling ink line when `boil` names a BoilDefs filter id.
 * `lampX` is the lamp's x: the shadow falls to the other side.
 */
export const ShadowActor: React.FC<PlayerProps & { lampX?: number; shadowDepth?: number; rod?: boolean; idle?: boolean; boil?: string; seed?: number }> = ({
  lampX = 600,
  shadowDepth = 1,
  rod = true,
  idle = true,
  boil,
  seed = 0,
  ...raw
}) => {
  const frame = useCurrentFrame();
  const { height } = useVideoConfig();
  const m = idle ? idleMotion(raw.who, frame, seed) : null;
  const p: PlayerProps = m
    ? {
        ...raw,
        rot: (raw.rot ?? 0) + m.rot,
        lift: (raw.lift ?? 0) + m.lift,
        headTilt: (raw.headTilt ?? 0) + m.headTilt,
        headDrop: (raw.headDrop ?? 0) + m.headDrop,
        eyesClosed: raw.eyesClosed ?? m.eyesClosed,
        autoBlink: raw.autoBlink ?? m.autoBlink,
      }
    : raw;
  const dir = p.x >= lampX ? 1 : -1;
  const b = actorBox(p.who, p.x, p.feet, p.width);
  const off = dir * (28 + Math.min(70, Math.abs(p.x - lampX) * 0.06)) * shadowDepth;
  const rimX = -dir * 3;
  return (
    <>
      {/* shadow on the screen */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${off}px, ${-10 * shadowDepth}px) scale(${1 + 0.05 * shadowDepth})`,
          transformOrigin: `${p.x}px ${p.feet}px`,
          filter: `blur(${4 + 4 * shadowDepth}px)`,
          opacity: 0.5 * (p.opacity ?? 1),
          zIndex: (p.z ?? 10) - 1,
        }}
      >
        <Player {...p} palette={BLACK} z={1} />
      </div>
      {rod ? (
        <div
          style={{
            position: "absolute",
            left: p.x - 3,
            top: b.top + b.h * 0.86 - (p.lift ?? 0),
            width: 6,
            height: height,
            background: `linear-gradient(90deg, ${SHADOW.cut}, ${SHADOW.cutMid})`,
            opacity: p.opacity ?? 1,
            zIndex: (p.z ?? 10) - 1,
          }}
        />
      ) : null}
      <Player
        {...p}
        filterId={boil}
        cssFilter={`drop-shadow(${rimX}px -2px 0px ${SHADOW.rim}) drop-shadow(${-rimX * 4}px 6px 10px ${SHADOW.shade}) sepia(0.16) saturate(0.95) brightness(0.97)`}
      />
    </>
  );
};
