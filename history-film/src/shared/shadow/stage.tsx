import React, { createContext, useContext } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { SHADOW } from "../theme";

// PARALLAX STAGE: a camera (x, y, zoom) shared by depth layers.
// depth 0 = the paper screen (barely moves), 1 = the focal plane, >1 = foreground between the lamp and us.

export type Cam = { x: number; y: number; zoom: number };
const CamCtx = createContext<Cam>({ x: 0, y: 0, zoom: 1 });

export const Stage: React.FC<{ cam: Cam; children: React.ReactNode }> = ({ cam, children }) => (
  <CamCtx.Provider value={cam}>
    <AbsoluteFill style={{ overflow: "hidden" }}>{children}</AbsoluteFill>
  </CamCtx.Provider>
);

export const Layer: React.FC<{ depth: number; blur?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  depth,
  blur = 0,
  children,
  style,
}) => {
  const c = useContext(CamCtx);
  const s = 1 + (c.zoom - 1) * depth;
  return (
    <AbsoluteFill
      style={{
        transform: `translate(${-c.x * depth}px, ${-c.y * depth}px) scale(${s})`,
        transformOrigin: "50% 55%",
        filter: blur ? `blur(${blur}px)` : undefined,
        ...style,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/**
 * A black card cut-out. Children are MASK content: fill="white" = card, fill="black" = a hole cut through it
 * (the lit screen shows through). Draws three passes: a soft shade on the screen, a lamp-side rim, the card.
 */
export const Cutout: React.FC<{
  id: string;
  children: React.ReactNode;
  color?: string;
  rim?: number;
  rimOffset?: [number, number];
  shade?: number;
  shadeOffset?: [number, number];
  shadeBlur?: number;
}> = ({ id, children, color = SHADOW.cut, rim = 0.85, rimOffset = [-3, -2], shade = 0.38, shadeOffset = [16, 6], shadeBlur = 9 }) => {
  const { width, height } = useVideoConfig();
  const pad = 600;
  const R = (fill: string, op = 1) => (
    <rect x={-pad} y={-pad} width={width + pad * 2} height={height + pad * 2} fill={fill} opacity={op} mask={`url(#${id})`} />
  );
  return (
    <svg width={width} height={height} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x={-pad} y={-pad} width={width + pad * 2} height={height + pad * 2}>
          {children}
        </mask>
        <filter id={`${id}-sb`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={shadeBlur} />
        </filter>
        <filter id={`${id}-rb`} x="-5%" y="-5%" width="110%" height="110%">
          <feGaussianBlur stdDeviation={1.6} />
        </filter>
      </defs>
      {shade > 0 ? (
        <g transform={`translate(${shadeOffset[0]} ${shadeOffset[1]})`} filter={`url(#${id}-sb)`}>
          {R(SHADOW.cut, shade)}
        </g>
      ) : null}
      {rim > 0 ? (
        <g transform={`translate(${rimOffset[0]} ${rimOffset[1]})`} filter={`url(#${id}-rb)`}>
          {R(SHADOW.rim, rim)}
        </g>
      ) : null}
      {R(color)}
    </svg>
  );
};
