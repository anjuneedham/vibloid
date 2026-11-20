import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { PaperGrain } from "../shadow/paper";
import { LINO } from "../theme";

/** Cream printing paper with fibres, and the pressed rectangle of the plate mark. */
export const LinoPaper: React.FC<{ children?: React.ReactNode; plate?: number }> = ({ children, plate = 26 }) => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: LINO.paper, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: `radial-gradient(${width}px ${height}px at 40% 35%, rgba(0,0,0,0) 40%, ${LINO.paperShade} 120%)` }} />
      {children}
      <PaperGrain opacity={0.28} film={0.03} />
      {/* plate mark: the paper is pressed down inside the block's edge */}
      <div
        style={{
          position: "absolute",
          left: plate,
          top: plate,
          right: plate,
          bottom: plate,
          boxShadow: `inset 2px 2px 0 ${LINO.paperShade}, inset -1px -1px 0 ${LINO.paper}`,
          pointerEvents: "none",
          opacity: 0.9,
        }}
      />
    </AbsoluteFill>
  );
};
