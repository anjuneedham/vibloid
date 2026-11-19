import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BoilDefs } from "../../shared/BoilDefs";
import { Clerk } from "../../shared/Clerk";
import { BANGERS } from "../../shared/fonts";
import { Grain } from "../../shared/Frame";

const INK = "#141210";
const PAPER = "#E6D8B8";

const Dancer: React.FC<{ x: number; scale: number; phase: number; solid?: boolean }> = ({
  x,
  scale,
  phase,
  solid,
}) => {
  const frame = useCurrentFrame();
  const t = frame / 5 + phase;
  const bounce = Math.abs(Math.sin(t)) * 34 * scale;
  const sway = Math.sin(t * 0.5) * 9;
  const w = 520 * scale;
  const h = (w * 620) / 400;
  const sq = 1 - 0.07 * (1 - Math.abs(Math.sin(t)));
  const palette = solid
    ? { ink: INK, skin: INK, coat: INK, shirt: INK, accent: INK, lens: PAPER, glass: PAPER, eye: INK }
    : { ink: INK, skin: PAPER, coat: "url(#hatch)", shirt: PAPER, accent: INK, lens: PAPER, glass: PAPER, eye: INK };
  return (
    <div
      style={{
        position: "absolute",
        left: x - w / 2,
        top: 900 - h * (608 / 620) - bounce,
        transform: `rotate(${sway}deg) scale(${1 / Math.sqrt(sq)}, ${sq})`,
        transformOrigin: "50% 98%",
      }}
    >
      <Clerk
        width={w}
        palette={palette}
        strokeWidth={solid ? 10 : 13}
        filterId="cut"
        armL={70 * Math.sin(t * 1.0 + 1)}
        armR={-70 * Math.sin(t * 1.0)}
        mouth="open"
        browLift={0.7}
        wide={solid ? 0 : 0.3}
        prop={false}
        idle={false}
        autoBlink={false}
      />
    </div>
  );
};

export const Woodcut: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const stamp = spring({ frame: frame - 14, fps, config: { damping: 9, stiffness: 200, mass: 0.7 } });
  const label = spring({ frame: frame - 34, fps, config: { damping: 9, stiffness: 200, mass: 0.7 } });

  const houses = [
    [60, 150, 150], [230, 120, 190], [370, 170, 130], [1420, 140, 170], [1580, 180, 140], [1780, 120, 200],
  ];

  return (
    <AbsoluteFill style={{ background: PAPER }}>
      <BoilDefs id="cut" scale={7} rate={9} frequency={0.045} />
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          <pattern id="hatch" width="11" height="11" patternUnits="userSpaceOnUse" patternTransform="rotate(40)">
            <rect width="11" height="11" fill={PAPER} />
            <line x1="0" y1="0" x2="0" y2="11" stroke={INK} strokeWidth="4" />
          </pattern>
          <pattern id="carve" width="30" height="18" patternUnits="userSpaceOnUse">
            <rect width="30" height="18" fill={INK} />
            <path d="M3 12 Q 14 2 27 12" stroke={PAPER} strokeWidth="3" fill="none" strokeLinecap="round" />
          </pattern>
        </defs>
      </svg>

      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        <g filter="url(#cut)">
          {/* sun with a face */}
          <g transform="translate(1560 250)">
            <g transform={`rotate(${frame * 0.35})`}>
              {Array.from({ length: 24 }).map((_, i) => (
                <path key={i} d="M-18 -112 L0 -250 L18 -112 Z" fill={INK} transform={`rotate(${i * 15})`} />
              ))}
            </g>
            <circle r={104} fill={PAPER} stroke={INK} strokeWidth={14} />
            <path d="M-50 -14 Q-34 -30 -18 -14" stroke={INK} strokeWidth={9} fill="none" strokeLinecap="round" />
            <path d="M18 -14 Q34 -30 50 -14" stroke={INK} strokeWidth={9} fill="none" strokeLinecap="round" />
            <path d="M-40 30 Q0 74 40 30" stroke={INK} strokeWidth={9} fill="none" strokeLinecap="round" />
          </g>

          {/* town silhouettes */}
          {houses.map(([x, w, h], i) => (
            <g key={i}>
              <path d={`M${x} 900 L${x} ${900 - h} L${x + w / 2} ${900 - h - 70} L${x + w} ${900 - h} L${x + w} 900 Z`} fill={INK} />
              <rect x={x + w * 0.25} y={900 - h * 0.65} width={w * 0.18} height={34} fill={PAPER} />
              <rect x={x + w * 0.6} y={900 - h * 0.65} width={w * 0.18} height={34} fill={PAPER} />
              <rect x={x + w * 0.42} y={900 - h * 0.28} width={w * 0.2} height={h * 0.28} fill={PAPER} />
            </g>
          ))}
          {/* church tower */}
          <path d="M1180 900 L1180 560 L1222 470 L1264 560 L1264 900 Z" fill={INK} />
          <path d="M1222 410 L1222 470 M1204 436 L1240 436" stroke={INK} strokeWidth={9} />
          <rect x={1208} y={600} width={28} height={64} rx={14} fill={PAPER} />

          {/* ground carved with white cuts */}
          <path
            d="M0 905 Q 240 868 480 900 T 960 896 T 1440 902 T 1920 890 L1920 1080 L0 1080 Z"
            fill="url(#carve)"
            stroke={INK}
            strokeWidth={10}
          />
        </g>
      </svg>

      <Dancer x={300} scale={0.52} phase={1.4} solid />
      <Dancer x={1640} scale={0.52} phase={2.6} solid />
      <Dancer x={960} scale={1.05} phase={0} />

      {/* date stamp */}
      <div
        style={{
          position: "absolute",
          left: 120,
          top: 96,
          transform: `scale(${0.5 + 0.5 * stamp}) rotate(${-5 * stamp}deg)`,
          transformOrigin: "0% 0%",
          opacity: Math.min(1, stamp * 2),
          filter: "url(#cut)",
        }}
      >
        <div style={{ fontFamily: BANGERS, fontSize: 200, lineHeight: 1, color: INK, letterSpacing: 4 }}>1518</div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 128,
          top: 290,
          transform: `scale(${0.6 + 0.4 * label}) rotate(${2 * label}deg)`,
          transformOrigin: "0% 0%",
          opacity: Math.min(1, label * 2),
          filter: "url(#cut)",
          background: INK,
          padding: "6px 22px 2px",
        }}
      >
        <div style={{ fontFamily: BANGERS, fontSize: 60, color: PAPER, letterSpacing: 3 }}>THE DANCING PLAGUE</div>
      </div>

      <Grain opacity={0.45} />
      <AbsoluteFill
        style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(60,40,10,0.35) 100%)" }}
      />
    </AbsoluteFill>
  );
};
