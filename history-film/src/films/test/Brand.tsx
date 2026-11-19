import React from "react";
import { AbsoluteFill } from "remotion";
import { BoilDefs } from "../../shared/BoilDefs";
import { Clerk } from "../../shared/Clerk";
import { BANGERS, COMIC } from "../../shared/fonts";
import { rand } from "../../shared/Frame";
import { THEME } from "../../shared/theme";

const Glow: React.FC<{ x: number; y: number; r: number; c: string; o: number }> = ({ x, y, r, c, o }) => (
  <div
    style={{
      position: "absolute",
      left: x - r,
      top: y - r,
      width: r * 2,
      height: r * 2,
      borderRadius: "50%",
      background: `radial-gradient(circle, ${c} 0%, rgba(0,0,0,0) 68%)`,
      opacity: o,
      mixBlendMode: "screen",
    }}
  />
);

/** 800 x 800 profile picture. YouTube crops it to a circle, so keep everything central. */
export const Avatar: React.FC = () => (
  <AbsoluteFill style={{ background: THEME.night }}>
    <BoilDefs id="boil" scale={6} rate={10} />
    <AbsoluteFill
      style={{ background: `radial-gradient(circle at 50% 45%, #2A2740 0%, ${THEME.night} 78%)` }}
    />
    <Glow x={170} y={640} r={520} c="#FF9A3C" o={0.5} />
    <div style={{ position: "absolute", left: 400 - 390, top: -40 }}>
      <Clerk
        width={780}
        filterId="boil"
        idle={false}
        autoBlink={false}
        mouth="smirk"
        browLift={0.25}
        browTilt={0.35}
        headTilt={-4}
        prop={false}
        armL={14}
        armR={-14}
        strokeWidth={9}
      />
    </div>
    {/* warm light on the face side */}
    <Glow x={190} y={420} r={330} c="#FFB36B" o={0.22} />
    <svg width={800} height={800} style={{ position: "absolute", left: 0, top: 0 }}>
      <circle cx={400} cy={400} r={384} fill="none" stroke={THEME.card} strokeWidth={14} />
    </svg>
  </AbsoluteFill>
);

/** 2560 x 1440 banner. Everything important sits inside the 1546 x 423 safe area (x 507-2053, y 508-931). */
export const Banner: React.FC = () => {
  const DESK = 818;
  const FLOOR = 1010;
  return (
    <AbsoluteFill style={{ background: THEME.night, overflow: "hidden" }}>
      <BoilDefs id="boil" scale={6} rate={10} />
      <AbsoluteFill
        style={{ background: `linear-gradient(180deg, #080914 0%, ${THEME.dusk} 70%, #0E0D18 100%)` }}
      />
      {/* stars */}
      <svg width={2560} height={1440} style={{ position: "absolute", left: 0, top: 0 }}>
        {Array.from({ length: 90 }).map((_, i) => (
          <circle
            key={i}
            cx={rand(i + 1) * 2560}
            cy={rand(i + 50) * 700}
            r={1 + rand(i + 99) * 2.2}
            fill="#DDE6FF"
            opacity={0.2 + rand(i + 7) * 0.5}
          />
        ))}
        <g filter="url(#boil)">
          <rect x={0} y={FLOOR - 160} width={2560} height={160} fill="#14131F" />
          <line x1={0} y1={FLOOR} x2={2560} y2={FLOOR} stroke="#5A5F6B" strokeWidth={5} />
          {/* window + moon, far right (outside the safe area) */}
          <rect x={2230} y={220} width={230} height={330} fill="#17233F" stroke={THEME.ink} strokeWidth={10} />
          <line x1={2345} y1={220} x2={2345} y2={550} stroke={THEME.ink} strokeWidth={8} />
          <line x1={2230} y1={385} x2={2460} y2={385} stroke={THEME.ink} strokeWidth={8} />
          <circle cx={2400} cy={300} r={32} fill="#DDE6FF" stroke={THEME.ink} strokeWidth={4} />
          {/* wall clock, far left (outside the safe area) */}
          <circle cx={250} cy={330} r={92} fill="#CDBFA0" stroke={THEME.ink} strokeWidth={9} />
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={i} x1={250} y1={250} x2={250} y2={i % 3 === 0 ? 272 : 264} stroke={THEME.ink} strokeWidth={i % 3 === 0 ? 6 : 4} transform={`rotate(${i * 30} 250 330)`} />
          ))}
          <line x1={250} y1={330} x2={250} y2={285} stroke={THEME.ink} strokeWidth={8} strokeLinecap="round" transform="rotate(-8 250 330)" />
          <line x1={250} y1={330} x2={250} y2={262} stroke={THEME.ink} strokeWidth={6} strokeLinecap="round" transform="rotate(-2 250 330)" />
          <circle cx={250} cy={330} r={7} fill={THEME.ink} />
        </g>
      </svg>

      {/* sleeping Clerk behind the desk, inside the safe area */}
      <div style={{ position: "absolute", left: 1700 - 200, top: DESK - 487 }}>
        <Clerk
          width={400}
          filterId="boil"
          idle={false}
          autoBlink={false}
          eyesClosed
          headDrop={190}
          headTilt={-14}
          mouth="o"
          prop
        />
      </div>

      <svg width={2560} height={1440} style={{ position: "absolute", left: 0, top: 0 }}>
        <g filter="url(#boil)">
          <rect x={1400} y={DESK + 36} width={640} height={FLOOR - DESK - 36} fill="#3A281C" stroke={THEME.ink} strokeWidth={9} />
          <rect x={1370} y={DESK} width={700} height={40} fill="#5B3F2A" stroke={THEME.ink} strokeWidth={9} />
          {/* candle */}
          <ellipse cx={1460} cy={DESK - 2} rx={46} ry={10} fill="#7C6A45" stroke={THEME.ink} strokeWidth={5} />
          <rect x={1446} y={DESK - 96} width={28} height={92} fill="#E8DFC6" stroke={THEME.ink} strokeWidth={5} />
          <g transform={`translate(1460 ${DESK - 98})`}>
            <path d="M0 0 Q 22 -30 0 -78 Q -22 -30 0 0 Z" fill="#FFB347" stroke={THEME.ink} strokeWidth={5} />
            <path d="M0 -2 Q 10 -20 0 -46 Q -10 -20 0 -2 Z" fill="#FFF1B8" />
          </g>
          {/* papers */}
          <rect x={1900} y={DESK - 28} width={130} height={28} fill="#EADFC4" stroke={THEME.ink} strokeWidth={5} transform="rotate(-2 1960 800)" />
          <rect x={1906} y={DESK - 54} width={124} height={26} fill="#D9CCAE" stroke={THEME.ink} strokeWidth={5} transform="rotate(3 1960 780)" />
        </g>
      </svg>

      <Glow x={1460} y={DESK - 100} r={720} c="#FF9A3C" o={0.55} />
      <Glow x={2345} y={380} r={420} c="#6D8CFF" o={0.3} />

      {/* title */}
      <div style={{ position: "absolute", left: 540, top: 520 }}>
        <div
          style={{
            fontFamily: BANGERS,
            fontSize: 214,
            lineHeight: 1,
            letterSpacing: 4,
            color: THEME.card,
            WebkitTextStroke: `18px ${THEME.ink}`,
            paintOrder: "stroke fill",
            whiteSpace: "nowrap",
          }}
        >
          PAST TENSE
        </div>
        <svg width={850} height={44} style={{ marginTop: 2 }}>
          <path
            d={`M6 22 ${Array.from({ length: 13 }).map((_, i) => `Q ${6 + i * 64 + 16} ${i % 2 === 0 ? 4 : 40} ${6 + (i + 1) * 64 - 16} 22`).join(" ")}`}
            fill="none"
            stroke={THEME.candle}
            strokeWidth={10}
            strokeLinecap="round"
          />
        </svg>
        <div
          style={{
            fontFamily: COMIC,
            fontWeight: 700,
            fontSize: 46,
            color: THEME.white,
            marginTop: 20,
            textShadow: "0 3px 10px rgba(0,0,0,0.85)",
          }}
        >
          Strange, dark and overlooked history.
        </div>
      </div>

      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 50%, rgba(0,0,0,0.75) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
