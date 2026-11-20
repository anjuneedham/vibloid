import React from "react";
import { AbsoluteFill } from "remotion";
import { BANGERS } from "../../shared/fonts";
import { Amphitheatre, BeamDust, Bloom, FortressWall, Hills, LampVignette, PaperGrain, Screen, ShadowActor } from "../../shared/shadow";
import { SHADOW } from "../../shared/theme";

// YouTube thumbnail for The Evidence Room, Part 2 (shadow theatre). Built at 1920 x 1080 so the shared stage pieces keep
// their coordinates; render with --scale=0.6667 for 1280 x 720. Headline asks the question; it never claims the table
// WAS the arena and never stamps a verdict. Bottom-right corner kept clear for YouTube's duration badge.

const CX = 960;
const CY = 800;
/** the table sits a little back in the arena so the near bank never hides its front */
const TY = 758;

/** The arena floor, glowing, with a round-table outline (ring + equal seats) laid in light on it. */
const GlowingTable: React.FC = () => (
  <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
    <defs>
      <radialGradient id="thumb-arena" cx="50%" cy="50%" r="60%">
        <stop offset="0" stopColor={SHADOW.lampCore} />
        <stop offset="0.45" stopColor={SHADOW.screenWarm} />
        <stop offset="1" stopColor={SHADOW.screenAmber} />
      </radialGradient>
      <filter id="thumb-glow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation={10} />
      </filter>
    </defs>
    <ellipse cx={CX} cy={CY + 10} rx={560} ry={190} fill="url(#thumb-arena)" />
    <g filter="url(#thumb-glow)" opacity={0.9}>
      <ellipse cx={CX} cy={TY} rx={300} ry={64} fill="none" stroke={SHADOW.lampCore} strokeWidth={26} />
    </g>
    <ellipse cx={CX} cy={TY} rx={300} ry={64} fill="none" stroke={SHADOW.thread} strokeWidth={12} />
    {Array.from({ length: 12 }).map((_, i) => {
      const a = (i / 12) * Math.PI * 2;
      return <circle key={i} cx={CX + Math.cos(a) * 360} cy={TY + Math.sin(a) * 80} r={14} fill={SHADOW.thread} stroke={SHADOW.cut} strokeWidth={4} />;
    })}
  </svg>
);

export const Thumbnail2: React.FC = () => (
  <AbsoluteFill style={{ background: SHADOW.room }}>
    <Screen hot={[CX, 560]} spread={0.95} />
    <Bloom x={CX} y={620} r={700} opacity={0.5} />
    <div style={{ position: "absolute", inset: 0, opacity: 0.75 }}>
      <Hills id="th-hills" />
    </div>
    <FortressWall id="th-wall" />
    <GlowingTable />
    <Amphitheatre id="th-amphi" cx={CX} cy={CY} />
    <Bloom x={CX} y={CY} r={520} opacity={0.55} color={SHADOW.lampGlow} />
    <BeamDust lamp={[CX, 600]} count={60} reach={900} />
    {/* DIG: delighted, arms up (left) */}
    <ShadowActor who="dig" x={330} feet={1010} width={440} lampX={CX} idle={false} armL={112} armR={-112} browLift={1} wide={0.8} mouth="open" headTilt={-5} />
    {/* DOUBT: flat-faced, unimpressed (right; feet kept above the duration badge) */}
    <ShadowActor who="doubt" x={1520} feet={960} width={420} lampX={CX} idle={false} browTilt={0.9} browLift={0.2} headTilt={6} mouth="flat" armL={10} armR={-10} />
    <PaperGrain opacity={0.38} film={0} />
    <LampVignette hot={[CX, 560]} strength={0.75} />
    {/* headline: stamped, max 4 words, high contrast */}
    <div style={{ position: "absolute", left: 0, right: 0, top: 26, textAlign: "center", transform: "rotate(-3deg)" }}>
      <div
        style={{
          display: "inline-block",
          fontFamily: BANGERS,
          fontSize: 200,
          letterSpacing: 4,
          lineHeight: 1,
          color: SHADOW.screenHot,
          WebkitTextStroke: `14px ${SHADOW.cut}`,
          paintOrder: "stroke fill",
          textShadow: `0 10px 0 ${SHADOW.cut}, 0 0 40px ${SHADOW.room}`,
          padding: "10px 30px 0",
        }}
      >
        ROUND TABLE <span style={{ color: SHADOW.thread }}>ON TRIAL</span>
      </div>
    </div>
  </AbsoluteFill>
);
