import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BoilDefs } from "../../shared/BoilDefs";
import { Clerk } from "../../shared/Clerk";
import { BANGERS, COMIC } from "../../shared/fonts";
import { clamp01, rand } from "../../shared/Frame";

const INK = "#0D0D12";

const Panel: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  start: number;
  bg: string;
  dots?: string;
  children: React.ReactNode;
  shake?: number;
}> = ({ x, y, w, h, start, bg, dots = "rgba(0,0,0,0.22)", children, shake = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - start, fps, config: { damping: 13, stiffness: 240, mass: 0.6 } });
  const visible = frame >= start;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        border: `11px solid ${INK}`,
        background: bg,
        overflow: "hidden",
        opacity: visible ? 1 : 0,
        transform: `scale(${1.18 - 0.18 * s}) translate(${shake}px, ${shake * -0.5}px)`,
        boxShadow: "10px 12px 0 rgba(0,0,0,0.35)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `radial-gradient(circle, ${dots} 3.2px, transparent 3.8px)`,
          backgroundSize: "18px 18px",
        }}
      />
      {children}
    </div>
  );
};

const Burst: React.FC<{ r: number; spikes: number; fill: string; stroke?: string; rot?: number }> = ({
  r,
  spikes,
  fill,
  stroke = INK,
  rot = 0,
}) => {
  const pts = Array.from({ length: spikes * 2 }).map((_, i) => {
    const a = (i / (spikes * 2)) * Math.PI * 2 + rot;
    const rr = i % 2 === 0 ? r : r * (0.58 + rand(i) * 0.1);
    return `${Math.cos(a) * rr},${Math.sin(a) * rr}`;
  });
  return <polygon points={pts.join(" ")} fill={fill} stroke={stroke} strokeWidth={9} strokeLinejoin="round" />;
};

export const Comic: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const hitT = frame - 150;
  const pageShake = hitT > 0 && hitT < 18 ? Math.sin(hitT * 2.8) * 12 * (1 - hitT / 18) : 0;
  const wham = spring({ frame: frame - 150, fps, config: { damping: 8, stiffness: 300, mass: 0.5 } });
  const bubble = spring({ frame: frame - 96, fps, config: { damping: 10, stiffness: 220, mass: 0.6 } });
  const flash = interpolate(frame, [150, 151, 160], [0, 0.7, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cap = spring({ frame: frame - 22, fps, config: { damping: 12, stiffness: 200, mass: 0.6 } });

  return (
    <AbsoluteFill
      style={{
        background: "#F4E9CC",
        transform: `translate(${pageShake}px, ${pageShake * 0.6}px)`,
      }}
    >
      <BoilDefs id="ink" scale={4} rate={8} frequency={0.02} />
      <AbsoluteFill
        style={{
          backgroundImage: "radial-gradient(circle, rgba(200,60,40,0.18) 3px, transparent 3.6px)",
          backgroundSize: "22px 22px",
        }}
      />

      {/* Panel A: the calm set-up */}
      <Panel x={60} y={86} w={1040} h={908} start={6} bg="linear-gradient(180deg,#FFD36B 0%,#FF9F43 100%)">
        <svg width={1040} height={908} style={{ position: "absolute", left: 0, top: 0 }}>
          <g transform="translate(840 190)">
            <Burst r={130} spikes={14} fill="#FFF1B0" rot={frame * 0.004} />
          </g>
          <path d="M0 760 Q 300 700 600 750 T 1040 730 L1040 908 L0 908 Z" fill="#B5612B" stroke={INK} strokeWidth={9} />
          <path d="M120 760 L120 650 M120 700 L90 670 M120 690 L150 660" stroke={INK} strokeWidth={9} fill="none" strokeLinecap="round" />
        </svg>
        <div style={{ position: "absolute", left: 300, top: 150 }}>
          <Clerk
            width={470}
            filterId="ink"
            strokeWidth={11}
            mouth="flat"
            browTilt={frame > 70 ? 0.6 : 0}
            browLift={-0.1}
            armR={-4 + Math.sin(frame / 12) * 4}
            idle
          />
        </div>
        <div
          style={{
            position: "absolute",
            left: 24,
            top: 24,
            background: "#FFF3A0",
            border: `7px solid ${INK}`,
            padding: "8px 22px",
            fontFamily: COMIC,
            fontWeight: 700,
            fontSize: 38,
            color: INK,
            transform: `scale(${0.6 + 0.4 * cap})`,
            transformOrigin: "0 0",
            opacity: clamp01((frame - 22) / 4),
          }}
        >
          MEANWHILE, IN 1932...
        </div>
      </Panel>

      {/* Panel B: the shocked close-up */}
      <Panel x={1140} y={86} w={720} h={430} start={66} bg="#FFFFFF" dots="rgba(0,0,0,0.1)">
        <svg width={720} height={430} style={{ position: "absolute", left: 0, top: 0 }}>
          {Array.from({ length: 36 }).map((_, i) => {
            const a = (i / 36) * Math.PI * 2;
            const r1 = 160 + rand(i) * 50;
            return (
              <line
                key={i}
                x1={230 + Math.cos(a) * r1}
                y1={250 + Math.sin(a) * r1}
                x2={230 + Math.cos(a) * 560}
                y2={250 + Math.sin(a) * 560}
                stroke={INK}
                strokeWidth={4 + rand(i + 2) * 5}
                opacity={0.8}
              />
            );
          })}
        </svg>
        <div style={{ position: "absolute", left: 30, top: 66 }}>
          <Clerk
            width={400}
            headOnly
            filterId="ink"
            strokeWidth={10}
            mouth="open"
            wide={1}
            browLift={1}
            headTilt={Math.sin(frame * 1.7) * 2.5}
            idle={false}
          />
        </div>
        <svg width={720} height={430} style={{ position: "absolute", left: 0, top: 0 }}>
          <g transform={`translate(520 118) scale(${0.3 + 0.7 * bubble * 0.82})`}>
            <path
              d="M-170 -62 Q -170 -86 -140 -86 L 140 -86 Q 170 -86 170 -62 L170 36 Q 170 60 140 60 L 40 60 L 12 108 L 4 60 L -140 60 Q -170 60 -170 36 Z"
              fill="#FFFFFF"
              stroke={INK}
              strokeWidth={8}
              strokeLinejoin="round"
            />
          </g>
        </svg>
        <div
          style={{
            position: "absolute",
            left: 372,
            top: 54,
            width: 296,
            textAlign: "center",
            fontFamily: COMIC,
            fontWeight: 700,
            fontSize: 34,
            lineHeight: 1.05,
            color: INK,
            transform: `scale(${0.3 + 0.7 * bubble})`,
            opacity: clamp01((frame - 98) / 4),
          }}
        >
          THEY'RE... WINNING?!
        </div>
      </Panel>

      {/* Panel C: the big hit */}
      <Panel x={1140} y={560} w={720} h={434} start={126} bg="linear-gradient(180deg,#FF5A4A 0%,#B3001B 100%)" dots="rgba(255,255,255,0.18)" shake={pageShake}>
        <svg width={720} height={434} style={{ position: "absolute", left: 0, top: 0 }}>
          {Array.from({ length: 30 }).map((_, i) => {
            const a = (i / 30) * Math.PI * 2;
            return (
              <line
                key={i}
                x1={360 + Math.cos(a) * 140}
                y1={217 + Math.sin(a) * 140}
                x2={360 + Math.cos(a) * 560}
                y2={217 + Math.sin(a) * 560}
                stroke="#FFF1B0"
                strokeWidth={3 + rand(i + 1) * 5}
                opacity={0.55}
              />
            );
          })}
          <g transform={`translate(360 217) rotate(${-8 + (1 - wham) * 20}) scale(${wham})`}>
            <Burst r={200} spikes={13} fill="#FFE600" />
          </g>
        </svg>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 120,
            width: 720,
            textAlign: "center",
            fontFamily: BANGERS,
            fontSize: 150,
            color: "#B3001B",
            letterSpacing: 4,
            transform: `scale(${wham}) rotate(${-8 + (1 - wham) * 20}deg)`,
            WebkitTextStroke: `7px ${INK}`,
            paintOrder: "stroke fill",
          }}
        >
          WHAM!
        </div>
        <div
          style={{
            position: "absolute",
            left: 470 + Math.max(0, frame - 150) * 16,
            top: 190 - Math.max(0, frame - 150) * 3 + Math.sin(frame / 3) * 3,
            transform: `rotate(${Math.max(0, frame - 150) * 22}deg)`,
          }}
        >
          <Clerk width={200} filterId="ink" strokeWidth={9} mouth="o" wide={1} browLift={1} idle={false} />
        </div>
      </Panel>

      <AbsoluteFill style={{ background: "#fff", opacity: flash, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
