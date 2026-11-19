import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BoilDefs } from "../../shared/BoilDefs";
import { Clerk } from "../../shared/Clerk";
import { BANGERS, COMIC } from "../../shared/fonts";
import { Dust, Glow, Letterbox, Vignette, Wordmark, rand } from "../../shared/Frame";
import { THEME } from "../../shared/theme";

const DESK_TOP = 720;
const FLOOR = 900;
const CLERK_X = 620;
const CLERK_W = 440;
const CLERK_TOP = 184;
const TITLE = "PAST TENSE";
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

const Clock: React.FC<{ x: number; y: number; r: number; ring: number }> = ({ x, y, r, ring }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = Math.floor(frame / 30);
  const tick = spring({ frame: frame % 30, fps, config: { damping: 6, stiffness: 320, mass: 0.4 } });
  const secAngle = (sec + tick) * 6;
  return (
    <g transform={`translate(${x} ${y}) rotate(${ring})`}>
      <circle r={r} fill="#CDBFA0" stroke={THEME.ink} strokeWidth={8} />
      {Array.from({ length: 12 }).map((_, i) => (
        <line
          key={i}
          x1={0}
          y1={-r + 10}
          x2={0}
          y2={-r + (i % 3 === 0 ? 24 : 16)}
          stroke={THEME.ink}
          strokeWidth={i % 3 === 0 ? 5 : 3}
          transform={`rotate(${i * 30})`}
        />
      ))}
      <line x1={0} y1={0} x2={0} y2={-r * 0.5} stroke={THEME.ink} strokeWidth={7} strokeLinecap="round" transform="rotate(-8)" />
      <line x1={0} y1={0} x2={0} y2={-r * 0.74} stroke={THEME.ink} strokeWidth={5} strokeLinecap="round" transform="rotate(2)" />
      <line x1={0} y1={8} x2={0} y2={-r * 0.8} stroke="#B3001B" strokeWidth={3} strokeLinecap="round" transform={`rotate(${secAngle})`} />
      <circle r={6} fill={THEME.ink} />
    </g>
  );
};

const Flame: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  const frame = useCurrentFrame();
  const sx = 1 + 0.08 * Math.sin(frame * 0.8) + 0.05 * Math.sin(frame * 2.1);
  const sy = 1 + 0.12 * Math.sin(frame * 0.6 + 1) + 0.06 * Math.sin(frame * 1.9);
  const lean = Math.sin(frame * 0.35) * 5;
  return (
    <g transform={`translate(${x} ${y}) rotate(${lean}) scale(${sx} ${sy})`}>
      <path d="M0 0 Q 22 -30 0 -78 Q -22 -30 0 0 Z" fill="#FFB347" stroke={THEME.ink} strokeWidth={5} />
      <path d="M0 -2 Q 10 -20 0 -46 Q -10 -20 0 -2 Z" fill="#FFF1B8" />
    </g>
  );
};

export const Test10s: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const WAKE = 135;
  const sleeping = frame < WAKE;

  // ---- Clerk performance ----
  const wake = spring({ frame: frame - WAKE, fps, config: { damping: 9, stiffness: 170, mass: 0.6 } });
  const wakeT = frame < WAKE ? 0 : wake;
  const headDrop = 190 * (1 - wakeT);
  const headTilt = -14 * (1 - wakeT);

  const jumpT = clamp01((frame - WAKE) / 16);
  const jumpY = frame >= WAKE && frame < WAKE + 16 ? -80 * Math.sin(Math.PI * jumpT) : 0;
  const stretch = frame >= WAKE && frame < WAKE + 16 ? 1 + 0.14 * Math.sin(Math.PI * jumpT) : 1;
  const squash = interpolate(frame, [WAKE + 16, WAKE + 20, WAKE + 28], [1, 0.88, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sy = stretch * squash;
  const sx = 1 / Math.sqrt(sy);

  const wide = interpolate(frame, [WAKE, WAKE + 5, WAKE + 38, WAKE + 58], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const browLift = interpolate(frame, [WAKE, WAKE + 5, WAKE + 40, WAKE + 65], [0, 1, 1, -0.15], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const browTilt = interpolate(frame, [WAKE + 40, WAKE + 65, WAKE + 130], [0, 0.55, 0.55], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const armL = interpolate(frame, [185, 205, 225, 245], [4, -160, -160, 4], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const armR = interpolate(frame, [WAKE, WAKE + 6, WAKE + 30], [-4, -35, -4], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const mouth = sleeping ? "o" : frame < WAKE + 40 ? "open" : frame < 200 ? "flat" : "smirk";

  // ---- camera: slow push-in while asleep, hard cut back on the wake ----
  const cam = sleeping ? interpolate(frame, [0, WAKE], [1, 1.07]) : 1;

  // ---- clock chimes at the wake ----
  const ring = frame >= WAKE ? Math.sin((frame - WAKE) * 1.4) * 6 * Math.max(0, 1 - (frame - WAKE) / 26) : 0;

  // ---- flash + speed lines at the wake ----
  const flash = interpolate(frame, [WAKE, WAKE + 1, WAKE + 9], [0, 0.55, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const lineOpacity = interpolate(frame, [WAKE + 1, WAKE + 4, WAKE + 16], [0, 0.9, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ---- title ----
  const chars = Math.floor(interpolate(frame, [200, 236], [0, TITLE.length], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }));
  const underline = interpolate(frame, [238, 262], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tagOpacity = interpolate(frame, [264, 280], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(frame, [288, 300], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ---- papers fly up at the wake ----
  const papers = Array.from({ length: 7 }).map((_, i) => {
    const t = (frame - WAKE) / 30;
    if (t < 0 || t > 3) return null;
    const vx = (rand(i + 3) - 0.5) * 260;
    const vy = 520 + rand(i + 9) * 260;
    const x = 880 + (rand(i + 5) - 0.5) * 120 + vx * t * 0.6 + Math.sin(t * 5 + i) * 30;
    const y = DESK_TOP - 20 - vy * t + 760 * t * t * 0.5;
    const rot = (rand(i + 7) - 0.5) * 80 + t * (rand(i + 13) - 0.5) * 400;
    const op = clamp01(1 - (t - 2) / 1);
    return (
      <rect
        key={i}
        x={-36}
        y={-46}
        width={72}
        height={92}
        fill="#EADFC4"
        stroke={THEME.ink}
        strokeWidth={5}
        transform={`translate(${x} ${y}) rotate(${rot})`}
        opacity={op}
      />
    );
  });

  return (
    <AbsoluteFill style={{ background: THEME.night, overflow: "hidden" }}>
      <BoilDefs id="boil" scale={5} rate={10} />

      <AbsoluteFill
        style={{
          transform: `scale(${cam})`,
          transformOrigin: `${CLERK_X}px 520px`,
        }}
      >
        {/* room */}
        <AbsoluteFill
          style={{
            background: `linear-gradient(180deg, #0B0C16 0%, ${THEME.dusk} 70%, #0E0D18 100%)`,
          }}
        />
        <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
          <g filter="url(#boil)">
            {/* back wall baseboard + floor */}
            <rect x={0} y={FLOOR - 140} width={1920} height={140} fill="#14131F" />
            <line x1={0} y1={FLOOR} x2={1920} y2={FLOOR} stroke="#5A5F6B" strokeWidth={4} />
            {/* window with moon */}
            <rect x={1520} y={130} width={240} height={290} fill="#17233F" stroke={THEME.ink} strokeWidth={9} />
            <line x1={1640} y1={130} x2={1640} y2={420} stroke={THEME.ink} strokeWidth={7} />
            <line x1={1520} y1={275} x2={1760} y2={275} stroke={THEME.ink} strokeWidth={7} />
            <circle cx={1700} cy={200} r={34} fill="#DDE6FF" stroke={THEME.ink} strokeWidth={4} />
            <Clock x={330} y={260} r={78} ring={ring} />
          </g>
        </svg>

        {/* The Clerk (behind the desk) */}
        <div
          style={{
            position: "absolute",
            left: CLERK_X - CLERK_W / 2,
            top: CLERK_TOP,
            transform: `translateY(${jumpY}px) scale(${sx}, ${sy})`,
            transformOrigin: "50% 92%",
          }}
        >
          <Clerk
            width={CLERK_W}
            filterId="boil"
            eyesClosed={sleeping}
            headDrop={headDrop}
            headTilt={headTilt}
            wide={wide}
            browLift={browLift}
            browTilt={browTilt}
            mouth={mouth}
            armL={armL}
            armR={armR}
            prop
          />
        </div>

        {/* desk and props */}
        <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
          <g filter="url(#boil)">
            <rect x={270} y={DESK_TOP + 34} width={720} height={FLOOR - DESK_TOP - 34} fill="#3A281C" stroke={THEME.ink} strokeWidth={8} />
            <rect x={250} y={DESK_TOP} width={760} height={36} fill="#5B3F2A" stroke={THEME.ink} strokeWidth={8} />
            {/* candle */}
            <ellipse cx={380} cy={DESK_TOP - 2} rx={44} ry={9} fill="#7C6A45" stroke={THEME.ink} strokeWidth={5} />
            <rect x={366} y={DESK_TOP - 92} width={28} height={88} fill="#E8DFC6" stroke={THEME.ink} strokeWidth={5} />
            <Flame x={380} y={DESK_TOP - 94} />
            {/* paper stack */}
            <rect x={840} y={DESK_TOP - 26} width={130} height={26} fill="#EADFC4" stroke={THEME.ink} strokeWidth={5} transform="rotate(-2 900 700)" />
            <rect x={846} y={DESK_TOP - 50} width={124} height={26} fill="#D9CCAE" stroke={THEME.ink} strokeWidth={5} transform="rotate(3 900 680)" />
            <rect x={836} y={DESK_TOP - 72} width={134} height={24} fill="#EADFC4" stroke={THEME.ink} strokeWidth={5} transform="rotate(-1 900 660)" />
            {/* ink pot */}
            <rect x={730} y={DESK_TOP - 36} width={44} height={36} rx={8} fill="#2A3550" stroke={THEME.ink} strokeWidth={5} />
          </g>
          {papers}
        </svg>

        {/* warm candle light + cool moon light */}
        <div style={{ position: "absolute", inset: 0, mixBlendMode: "screen", pointerEvents: "none" }}>
          <Glow x={380} y={DESK_TOP - 90} size={620} color="#FF9A3C" opacity={0.55} />
          <Glow x={620} y={520} size={420} color="#FFB36B" opacity={0.18} flicker={0.04} />
          <Glow x={1640} y={270} size={420} color="#6D8CFF" opacity={0.28} flicker={0.02} />
        </div>

        {/* Zzz while asleep */}
        {sleeping
          ? [0, 1, 2].map((i) => {
              const t = ((frame + i * 24) % 72) / 72;
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: 820 + t * 60 + i * 14,
                    top: 560 - t * 190,
                    fontFamily: COMIC,
                    fontWeight: 700,
                    fontSize: 34 + t * 40,
                    color: THEME.white,
                    opacity: Math.sin(Math.PI * t) * 0.8,
                    transform: `rotate(${-10 + t * 20}deg)`,
                  }}
                >
                  z
                </div>
              );
            })
          : null}

        {/* speed lines on the wake */}
        <svg
          width={1920}
          height={1080}
          style={{ position: "absolute", left: 0, top: 0, opacity: lineOpacity }}
        >
          {Array.from({ length: 22 }).map((_, i) => {
            const a = (i / 22) * Math.PI * 2 + rand(i) * 0.1;
            const r1 = 250 + rand(i + 4) * 60;
            const r2 = r1 + 160 + rand(i + 8) * 200;
            return (
              <line
                key={i}
                x1={CLERK_X + Math.cos(a) * r1}
                y1={400 + Math.sin(a) * r1}
                x2={CLERK_X + Math.cos(a) * r2}
                y2={400 + Math.sin(a) * r2}
                stroke="#FFFFFF"
                strokeWidth={5}
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        {/* title */}
        <div style={{ position: "absolute", left: 1060, top: 400, width: 760 }}>
          <div
            style={{
              fontFamily: BANGERS,
              fontSize: 178,
              lineHeight: 1,
              letterSpacing: 3,
              color: THEME.card,
              WebkitTextStroke: `16px ${THEME.ink}`,
              paintOrder: "stroke fill",
              whiteSpace: "nowrap",
              height: 190,
            }}
          >
            {TITLE.split("").map((ch, i) => {
              const born = 200 + (i / TITLE.length) * 36;
              const pop = i < chars ? spring({ frame: frame - born, fps, config: { damping: 8, stiffness: 260, mass: 0.5 } }) : 0;
              return (
                <span
                  key={i}
                  style={{
                    display: "inline-block",
                    opacity: i < chars ? 1 : 0,
                    transform: `scale(${0.5 + 0.5 * pop}) translateY(${(1 - pop) * -30}px)`,
                    whiteSpace: "pre",
                  }}
                >
                  {ch}
                </span>
              );
            })}
          </div>
          <svg width={760} height={40} style={{ marginTop: 6 }}>
            <path
              d={`M6 20 ${Array.from({ length: 12 }).map((_, i) => `Q ${6 + i * 62 + 15} ${i % 2 === 0 ? 2 : 38} ${6 + (i + 1) * 62 - 16} 20`).join(" ")}`}
              fill="none"
              stroke={THEME.candle}
              strokeWidth={9}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - underline}
            />
          </svg>
          <div
            style={{
              fontFamily: COMIC,
              fontWeight: 700,
              fontSize: 42,
              color: THEME.white,
              opacity: tagOpacity,
              marginTop: 18,
              textShadow: "0 3px 10px rgba(0,0,0,0.8)",
              transform: `translateY(${(1 - tagOpacity) * 14}px)`,
            }}
          >
            Strange, dark and overlooked history.
          </div>
        </div>
      </AbsoluteFill>

      <Dust />
      <Vignette />
      <Wordmark opacity={interpolate(frame, [200, 240], [0, 0.5], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      <AbsoluteFill style={{ background: "#fff", opacity: flash, zIndex: 950, pointerEvents: "none" }} />
      <AbsoluteFill style={{ background: "#000", opacity: fadeOut, zIndex: 960, pointerEvents: "none" }} />
      <Letterbox />
    </AbsoluteFill>
  );
};
