import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BoilDefs } from "./BoilDefs";
import { Glow, rand } from "./Frame";
import { THEME } from "./theme";

const POLAROIDS: [number, number, number, string][] = [
  [330, 190, -6, "#8C6F46"],
  [560, 150, 4, "#5E6F7A"],
  [800, 205, -3, "#7A5E4C"],
  [1040, 160, 5, "#6D7A5A"],
  [1290, 200, -5, "#85694A"],
  [1530, 155, 3, "#5B6A80"],
];

/** The series set: a dark evidence room with a pin-board, red string and a hanging lamp. */
export const EvidenceRoom: React.FC<{ lampX?: number; floorY?: number; children?: React.ReactNode }> = ({
  lampX = 960,
  floorY = 900,
  children,
}) => {
  const frame = useCurrentFrame();
  const swing = Math.sin(frame / 38) * 1.6;
  return (
    <AbsoluteFill style={{ background: THEME.night }}>
      <BoilDefs id="room" scale={4} rate={8} />
      <AbsoluteFill
        style={{ background: `linear-gradient(180deg, #0A0B14 0%, ${THEME.dusk} 75%, #0E0D18 100%)` }}
      />
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        <g filter="url(#room)">
          {/* cork pin-board */}
          <rect x={200} y={110} width={1520} height={560} fill="#5A4129" stroke={THEME.ink} strokeWidth={9} />
          <rect x={218} y={128} width={1484} height={524} fill="#6E5236" opacity={0.55} />
          {POLAROIDS.map(([x, y, r, c], i) => (
            <g key={i} transform={`rotate(${r} ${x + 90} ${y + 100})`}>
              <rect x={x} y={y} width={180} height={210} fill="#EFE6D0" stroke={THEME.ink} strokeWidth={5} />
              <rect x={x + 14} y={y + 14} width={152} height={140} fill={c} />
              <rect x={x + 30} y={y + 168} width={90} height={9} fill={THEME.ink} opacity={0.5} />
              <circle cx={x + 90} cy={y + 8} r={7} fill="#B3261E" stroke={THEME.ink} strokeWidth={3} />
            </g>
          ))}
          {/* red string joining the pins */}
          <path
            d={POLAROIDS.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x + 90} ${y + 8}`).join(" ")}
            fill="none"
            stroke="#C23B2C"
            strokeWidth={4}
          />
          {/* floor */}
          <rect x={0} y={floorY - 130} width={1920} height={130 + 180} fill="#12111C" />
          <line x1={0} y1={floorY} x2={1920} y2={floorY} stroke="#5A5F6B" strokeWidth={4} />
          {/* hanging lamp */}
          <g transform={`rotate(${swing} ${lampX} 0)`}>
            <line x1={lampX} y1={0} x2={lampX} y2={64} stroke={THEME.ink} strokeWidth={6} />
            <path d={`M${lampX - 70} 130 Q ${lampX - 60} 72 ${lampX} 66 Q ${lampX + 60} 72 ${lampX + 70} 130 Z`} fill="#3F6B5A" stroke={THEME.ink} strokeWidth={7} />
            <ellipse cx={lampX} cy={132} rx={50} ry={10} fill="#FFE7A8" />
          </g>
        </g>
      </svg>
      {children}
      <div style={{ position: "absolute", inset: 0, mixBlendMode: "screen", pointerEvents: "none" }}>
        <Glow x={lampX} y={160} size={900} color="#FFB36B" opacity={0.38} flicker={0.03} />
      </div>
      {/* a few dust motes in the lamp light */}
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}>
        {Array.from({ length: 26 }).map((_, i) => (
          <circle
            key={i}
            cx={lampX + (rand(i) - 0.5) * 700 + Math.sin(frame / 50 + i) * 20}
            cy={(180 + rand(i + 3) * 700 + frame * (0.2 + rand(i + 8) * 0.3)) % 900}
            r={1.5 + rand(i + 6) * 2}
            fill="#FFE2A8"
            opacity={0.25 + 0.3 * Math.abs(Math.sin(frame / 20 + i))}
          />
        ))}
      </svg>
    </AbsoluteFill>
  );
};
