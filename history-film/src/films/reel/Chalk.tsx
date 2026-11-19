import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Clerk } from "../../shared/Clerk";
import { COMIC } from "../../shared/fonts";
import { clamp01, rand } from "../../shared/Frame";

const CHALK = "#F1F0E6";
const YELLOW = "#FFE98A";
const PINK = "#FF9FB0";

const EVENTS: [string, string][] = [
  ["1325", "War of the Bucket"],
  ["1518", "Dancing Plague"],
  ["1816", "Year Without a Summer"],
  ["1870", "Paris eats the zoo"],
];

const ChalkText: React.FC<{
  text: string;
  size: number;
  color?: string;
  start: number;
  end: number;
  style?: React.CSSProperties;
}> = ({ text, size, color = CHALK, start, end, style }) => {
  const frame = useCurrentFrame();
  const n = Math.floor(interpolate(frame, [start, end], [0, text.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  return (
    <div
      style={{
        fontFamily: COMIC,
        fontWeight: 700,
        fontSize: size,
        color,
        filter: "url(#chalk)",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {text.slice(0, n)}
    </div>
  );
};

export const Chalk: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const clerkDraw = clamp01((frame - 8) / 105);
  const lineDraw = clamp01((frame - 140) / 40);
  const underline = clamp01((frame - 138) / 20);
  const pointing = interpolate(frame, [118, 140], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // chalk dust trail at the drawing tip
  const dust = Array.from({ length: 16 }).map((_, i) => {
    const life = ((frame * 1.4 + i * 9) % 40) / 40;
    return (
      <circle
        key={i}
        cx={190 + rand(i) * 360 + Math.sin(frame / 10 + i) * 10}
        cy={430 + rand(i + 5) * 260 + life * 40}
        r={2 + rand(i + 9) * 2}
        fill={CHALK}
        opacity={0.35 * (1 - life) * (frame < 130 ? 1 : 0)}
      />
    );
  });

  return (
    <AbsoluteFill style={{ background: "#16221F" }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          <filter id="chalk" x="-6%" y="-6%" width="112%" height="112%">
            <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="3" result="warp" />
            <feDisplacementMap in="SourceGraphic" in2="warp" scale="4" result="d" />
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="8" result="grain" />
            <feColorMatrix
              in="grain"
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  3.2 0 0 0 -0.75"
              result="holes"
            />
            <feComposite in="d" in2="holes" operator="in" />
          </filter>
        </defs>
      </svg>

      {/* smudged board */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 30% 40%, rgba(255,255,255,0.10) 0%, rgba(0,0,0,0) 45%), radial-gradient(ellipse at 75% 70%, rgba(255,255,255,0.07) 0%, rgba(0,0,0,0) 50%), #1B2B27",
        }}
      />
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        {/* old erased smudges */}
        {Array.from({ length: 9 }).map((_, i) => (
          <ellipse
            key={i}
            cx={200 + rand(i) * 1500}
            cy={150 + rand(i + 4) * 700}
            rx={180 + rand(i + 8) * 200}
            ry={30 + rand(i + 12) * 40}
            fill="#FFFFFF"
            opacity={0.035}
            transform={`rotate(${(rand(i + 3) - 0.5) * 30} 960 540)`}
          />
        ))}
        {/* wooden frame */}
        <rect x={0} y={54} width={1920} height={30} fill="#6B4A2E" />
        <rect x={0} y={0} width={36} height={1080} fill="#6B4A2E" />
        <rect x={1884} y={0} width={36} height={1080} fill="#6B4A2E" />
        <rect x={0} y={960} width={1920} height={70} fill="#7A5535" />
        <rect x={0} y={956} width={1920} height={8} fill="#3A2716" />
        {/* chalk + eraser on the ledge */}
        <rect x={1500} y={934} width={90} height={22} rx={6} fill={CHALK} />
        <rect x={1640} y={920} width={130} height={36} rx={6} fill="#3B3B46" />
        <rect x={1640} y={920} width={130} height={14} rx={6} fill="#B8A25F" />
      </svg>

      {/* the Clerk drawn in chalk */}
      <div style={{ position: "absolute", left: 150, top: 160 }}>
        <Clerk
          width={500}
          draw={clerkDraw}
          strokeWidth={6}
          filterId={undefined}
          palette={{
            ink: CHALK,
            skin: "none",
            coat: "none",
            shirt: "none",
            accent: PINK,
            lens: "none",
            glass: "none",
            eye: CHALK,
          }}
          prop={false}
          mouth="smile"
          browLift={0.2}
          armR={-4 - 78 * pointing}
          style={{ filter: "url(#chalk)" }}
        />
      </div>
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>{dust}</svg>

      {/* lesson title */}
      <div style={{ position: "absolute", left: 850, top: 170 }}>
        <ChalkText text="A QUICK TIMELINE" size={76} start={118} end={150} />
        <svg width={760} height={30}>
          <path
            d="M6 14 Q 60 2 120 14 T 240 14 T 360 14 T 480 14 T 600 14 T 740 14"
            fill="none"
            stroke={YELLOW}
            strokeWidth={7}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - underline}
            style={{ filter: "url(#chalk)" }}
          />
        </svg>
      </div>

      {/* timeline */}
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        <path
          d="M830 620 L1790 620"
          fill="none"
          stroke={CHALK}
          strokeWidth={7}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - lineDraw}
          style={{ filter: "url(#chalk)" }}
        />
        <path
          d="M1760 596 L1796 620 L1760 644"
          fill="none"
          stroke={CHALK}
          strokeWidth={7}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={lineDraw > 0.95 ? 1 : 0}
          style={{ filter: "url(#chalk)" }}
        />
      </svg>
      {EVENTS.map(([year, name], i) => {
        const x = 960 + i * 250;
        const start = 180 + i * 22;
        const pop = spring({ frame: frame - start, fps, config: { damping: 10, stiffness: 220, mass: 0.6 } });
        const vis = frame >= start;
        return (
          <div key={year} style={{ opacity: vis ? 1 : 0 }}>
            <div
              style={{
                position: "absolute",
                left: x - 8,
                top: 598,
                width: 16,
                height: 46,
                borderRadius: 8,
                background: PINK,
                filter: "url(#chalk)",
                transform: `scaleY(${pop})`,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: x - 100,
                top: 500,
                width: 200,
                textAlign: "center",
                transform: `scale(${0.4 + 0.6 * pop}) rotate(${(1 - pop) * -8}deg)`,
              }}
            >
              <div style={{ fontFamily: COMIC, fontWeight: 700, fontSize: 66, color: CHALK, filter: "url(#chalk)" }}>
                {year}
              </div>
            </div>
            <div
              style={{
                position: "absolute",
                left: x - 110,
                top: 668,
                width: 220,
                textAlign: "center",
                fontFamily: COMIC,
                fontWeight: 700,
                fontSize: 34,
                lineHeight: 1.15,
                color: YELLOW,
                filter: "url(#chalk)",
                opacity: clamp01((frame - start - 6) / 8),
              }}
            >
              {name}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
